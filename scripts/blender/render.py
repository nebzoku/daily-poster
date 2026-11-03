"""Renders the day's 3D objects with Blender (run as plain Python with the bpy package).

Reads a job file:
  {"hdri": "path.hdr" | null, "out_size": 1080, "samples": 96,
   "objects": [{"model": "path.glb" | null, "shape": "rock" | "sphere" | ..., "out": "path.png",
                "texture": {"diff": "...jpg", "rough": "...jpg", "arm": "...jpg" | null, "metal": true} | null,
                "seed": 3}]}
Each object is scaled to the same size, given the texture by box projection (low-poly
models don't have usable UVs), lit by the studio HDRI and rendered on a transparent background.
"""
import bpy, json, math, sys, time
from mathutils import Vector

job = json.load(open(sys.argv[-1]))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = job.get("samples", 96)
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = job.get("out_size", 1080)
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    return sc


def world(sc):
    w = bpy.data.worlds.new("studio"); w.use_nodes = True; sc.world = w
    nt = w.node_tree; bg = nt.nodes["Background"]
    if job.get("hdri"):
        env = nt.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(job["hdri"])
        nt.links.new(env.outputs["Color"], bg.inputs["Color"])
        bg.inputs["Strength"].default_value = 1.0
    else:
        bg.inputs["Color"].default_value = (0.55, 0.55, 0.57, 1)
        bg.inputs["Strength"].default_value = 0.7


def light(sc, name, loc, power, size):
    l = bpy.data.lights.new(name, "AREA"); l.energy = power; l.size = size
    o = bpy.data.objects.new(name, l); o.location = loc; sc.collection.objects.link(o)
    o.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()


def shape(kind, seed):
    """Shapes made here, for when no model fits."""
    if kind == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48)
    elif kind == "cube":
        bpy.ops.mesh.primitive_cube_add(); bpy.context.object.modifiers.new("b", "BEVEL").width = 0.06
    elif kind == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, depth=2.4); bpy.context.object.modifiers.new("b", "BEVEL").width = 0.04
    elif kind == "ring":
        bpy.ops.mesh.primitive_torus_add(major_segments=128, minor_segments=48, minor_radius=0.32)
    elif kind == "slab":
        bpy.ops.mesh.primitive_cube_add(); o = bpy.context.object; o.scale = (1, 0.18, 1.4)
        bpy.ops.object.transform_apply(scale=True); o.modifiers.new("b", "BEVEL").width = 0.03
    else:  # rock
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=6)
        o = bpy.context.object; o.scale = (1.15, 0.95, 0.82)
        t = bpy.data.textures.new("lumps", "CLOUDS"); t.noise_scale = 0.9; t.noise_depth = 3
        t.noise_basis = "ORIGINAL_PERLIN"
        d = o.modifiers.new("lumps", "DISPLACE"); d.texture = t; d.strength = 0.42
        d.texture_coords = "LOCAL"
        o.location = (0, 0, 0)
        t2 = bpy.data.textures.new("chips", "VORONOI"); t2.noise_scale = 0.35
        d2 = o.modifiers.new("chips", "DISPLACE"); d2.texture = t2; d2.strength = -0.12
        # A different rock each time: move the noise.
        e = bpy.data.objects.new("noise", None); bpy.context.scene.collection.objects.link(e)
        e.location = (seed * 1.7, seed * 0.9, seed * 2.3); d.texture_coords = "OBJECT"; d.texture_coords_object = e
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    return [o]


def load(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return [o]


def fit(objs):
    """Centre the object and scale it so its longest side is 2 units."""
    o = objs[0]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    size = max((hi - lo)) or 1
    o.location -= (lo + hi) / 2
    bpy.context.view_layer.update()
    s = 2 / size
    o.scale = [v * s for v in o.scale]
    o.location *= s
    bpy.context.view_layer.update()
    return o


def material(o, tex):
    m = bpy.data.materials.new("surface"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N["Principled BSDF"]
    if tex:
        coord = N.new("ShaderNodeTexCoord")
        mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (tex.get("scale", 0.6),) * 3
        L.new(coord.outputs["Object"], mp.inputs["Vector"])

        def img(path, colour):
            n = N.new("ShaderNodeTexImage"); n.image = bpy.data.images.load(path)
            n.projection = "BOX"; n.projection_blend = 0.3
            if not colour:
                n.image.colorspace_settings.name = "Non-Color"
            L.new(mp.outputs["Vector"], n.inputs["Vector"])
            return n

        diff = img(tex["diff"], True); L.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
        if tex.get("rough"):
            r = img(tex["rough"], False); L.new(r.outputs["Color"], bsdf.inputs["Roughness"])
            bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.25
            L.new(r.outputs["Color"], bump.inputs["Height"]); L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        if tex.get("arm"):
            a = img(tex["arm"], False); sep = N.new("ShaderNodeSeparateColor")
            L.new(a.outputs["Color"], sep.inputs["Color"]); L.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
        else:
            bsdf.inputs["Metallic"].default_value = 0.9 if tex.get("metal") else 0.0
    else:
        bsdf.inputs["Base Color"].default_value = (0.6, 0.6, 0.62, 1)
        bsdf.inputs["Metallic"].default_value = 1.0; bsdf.inputs["Roughness"].default_value = 0.25
    o.data.materials.clear(); o.data.materials.append(m)
    for p in o.data.polygons:
        p.material_index = 0


for i, ob in enumerate(job["objects"]):
    t0 = time.time()
    sc = reset(); world(sc)
    light(sc, "key", (3.5, -3, 4), 500, 3); light(sc, "rim", (-3, 3.5, 2.5), 400, 2)
    try:
        objs = load(ob["model"]) if ob.get("model") else shape(ob.get("shape", "rock"), ob.get("seed", i))
    except Exception as e:  # a broken model falls back to a rock
        print("model failed:", e, flush=True)
        sc = reset(); world(sc); light(sc, "key", (3.5, -3, 4), 500, 3); light(sc, "rim", (-3, 3.5, 2.5), 400, 2)
        objs = shape("rock", i)
    o = fit(objs)
    o.rotation_euler.z += math.radians(ob.get("turn", 28))
    material(o, ob.get("texture"))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 85
    loc = Vector((5.2, -6.4, 3.4)).normalized() * 7.6   # three-quarter, a little above
    cam.location = loc; cam.rotation_euler = (-loc).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = ob["out"]
    bpy.ops.render.render(write_still=True)
    print(f"rendered {ob['out']} in {time.time() - t0:.0f}s", flush=True)
