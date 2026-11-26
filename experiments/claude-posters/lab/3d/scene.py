"""3D scamps for the illustration style (Ben, 26 Nov 2026: "generate 3D scenes and then take shots of them from super
low angles to get the geometry and perspective right"). A scene is built from simple geometry (and, in CI, models from
the brief or Sketchfab), shot from a dramatic camera, and rendered as three passes the lab draws over:
  <name>-lines.png  Freestyle ink lines only (black on white), exact perspective
  <name>-ids.png    each part in its own flat colour (an ID map), so the lab can fill parts with palette colours
  <name>-light.png  plain diffuse light, grey, so the lab can threshold the cel shadows
Run: python3 scene.py <scene-name> <out-dir> [width height]. Scenes are functions below, registered in SCENES.
"""
import bpy, math, sys, os
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
NAME, OUT = args[0], args[1]
WIDTH, HEIGHT = (int(args[2]), int(args[3])) if len(args) > 3 else (1080, 1528)
PARTS = {}   # part name -> id colour (r, g, b) 0..1, listed in <name>-ids.json


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 8; sc.cycles.use_denoising = False
    sc.render.resolution_x, sc.render.resolution_y = WIDTH, HEIGHT
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    return sc


def part(name):
    """A material per part, flat-coloured in the ID pass and plain grey in the light pass."""
    if name in bpy.data.materials: return bpy.data.materials[name]
    i = len(PARTS) + 1
    col = (((i * 67) % 255) / 255, ((i * 151) % 255) / 255, ((i * 211) % 255) / 255)
    PARTS[name] = col
    m = bpy.data.materials.new(name); m.use_nodes = True; return m


def obj_add(o, mat):
    if o.data.materials: o.data.materials[0] = mat
    else: o.data.materials.append(mat)
    return o


def box(name, loc, size, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); bpy.ops.object.transform_apply(scale=True)
    return obj_add(o, part(mat))


def cyl(name, a, b, r, mat, verts=24):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object; o.name = name; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return obj_add(o, part(mat))


def camera(sc, loc, look, lens=14):
    c = bpy.data.cameras.new('cam'); c.lens = lens; c.sensor_fit = 'HORIZONTAL'
    o = bpy.data.objects.new('cam', c); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); sc.camera = o


def sun(sc, direction, strength=4):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = strength; l.angle = 0.02
    o = bpy.data.objects.new('sun', l); sc.collection.objects.link(o)
    o.rotation_euler = (-Vector(direction)).to_track_quat('-Z', 'Y').to_euler()


# ---------------------------------------------------------------- scenes
def mesh_boxes(name, boxes, mat):
    """Many boxes as ONE mesh (bmesh), so a brick wall is one object, not thousands."""
    import bmesh
    bm = bmesh.new()
    for (cx, cy, cz, sx, sy, sz) in boxes:
        r = bmesh.ops.create_cube(bm, size=1.0)
        for v in r['verts']: v.co.x = cx + v.co.x * sx; v.co.y = cy + v.co.y * sy; v.co.z = cz + v.co.z * sz
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return obj_add(o, part(mat))


def shaft(sc):
    """049: looking straight up a brick lift shaft; the cage halfway up on its cables, a plumb bob hanging towards us."""
    S, Hh = 3.0, 16.0
    bw, bh, bd, gap = 0.46, 0.15, 0.06, 0.014
    walls = {k: [] for k in ('wallN', 'wallS', 'wallE', 'wallW')}
    for r in range(int(Hh / (bh + gap))):
        z = r * (bh + gap) + bh / 2; off = (bw / 2) if r % 2 else 0
        for k in range(-1, int(S / (bw + gap)) + 2):
            u0 = max(-S / 2 + off + k * (bw + gap) - bw / 2, -S / 2); u1 = min(u0 + bw, S / 2)
            if u1 - u0 < 0.03: continue
            c, w = (u0 + u1) / 2, u1 - u0
            walls['wallN'].append((c, S / 2 + bd / 2, z, w, bd, bh)); walls['wallS'].append((c, -S / 2 - bd / 2, z, w, bd, bh))
            walls['wallE'].append((S / 2 + bd / 2, c, z, bd, w, bh)); walls['wallW'].append((-S / 2 - bd / 2, c, z, bd, w, bh))
    for k, v in walls.items(): mesh_boxes(k, v, k)
    mesh_boxes('mortar', [(0, S / 2 + bd + 0.02, Hh / 2, S + 1, 0.04, Hh), (0, -S / 2 - bd - 0.02, Hh / 2, S + 1, 0.04, Hh), (S / 2 + bd + 0.02, 0, Hh / 2, 0.04, S + 1, Hh), (-S / 2 - bd - 0.02, 0, Hh / 2, 0.04, S + 1, Hh)], 'mortar')
    zc = 7.0
    mesh_boxes('cage', [(0, 0, zc, 2.4, 2.4, 0.08), (0, 0, zc + 2.4, 2.4, 2.4, 0.06)], 'cage')
    frame = [(i * 0.28, 0, zc - 0.06, 0.025, 2.4, 0.025) for i in range(-4, 5)] + [(0, i * 0.28, zc - 0.07, 2.4, 0.025, 0.025) for i in range(-4, 5)]
    frame += [(x, y, zc + 1.2, 0.07, 0.07, 2.4) for x in (-1.2, 1.2) for y in (-1.2, 1.2)] + [(x, 0, (zc + 2.4 + Hh) / 2, 0.05, 0.05, Hh - zc - 2.4) for x in (-0.4, 0.4)]
    mesh_boxes('frame', frame, 'cageframe')
    mesh_boxes('thread', [(0.15, 0.1, (zc + 2.3) / 2, 0.012, 0.012, zc - 2.3)], 'thread')
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.16, depth=0.34, location=(0.15, 0.1, 2.02), rotation=(math.pi, 0, 0)); obj_add(bpy.context.object, part('bob'))
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.16, depth=0.1, location=(0.15, 0.1, 2.24)); obj_add(bpy.context.object, part('bob'))
    mesh_boxes('sky', [(0, 0, Hh + 0.5, S + 2, S + 2, 0.1)], 'sky')
    camera(sc, (-0.55, -0.7, 0.4), (0.25, 0.35, 10), lens=11)
    sun(sc, (0.35, 0.25, -1), 5)


SCENES = {'shaft': shaft}


def freestyle(sc, on=True):
    sc.render.use_freestyle = on; sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 1.6
    vl = sc.view_layers[0]; vl.use_freestyle = on
    if on:
        ls = vl.freestyle_settings.linesets[0] if vl.freestyle_settings.linesets else vl.freestyle_settings.linesets.new('lines')
        ls.select_by_visibility = True; ls.select_by_edge_types = True
        ls.select_silhouette = ls.select_border = ls.select_crease = True
        if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
        ls.linestyle.color = (0, 0, 0); ls.linestyle.thickness = 1.6


def set_world(sc, col, strength=1):
    nt = sc.world.node_tree; bg = nt.nodes['Background']; bg.inputs['Color'].default_value = (*col, 1); bg.inputs['Strength'].default_value = strength


def materials(mode):
    for name, col in PARTS.items():
        m = bpy.data.materials[name]; nt = m.node_tree; nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        if mode == 'ids': e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1); nt.links.new(e.outputs[0], out.inputs[0])
        elif mode == 'white': e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (1, 1, 1, 1); nt.links.new(e.outputs[0], out.inputs[0])
        else: d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (0.8, 0.8, 0.8, 1); nt.links.new(d.outputs[0], out.inputs[0])


def render(sc, path):
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)


sc = reset(); SCENES[NAME](sc); os.makedirs(OUT, exist_ok=True)
sc.cycles.samples = 1; sc.cycles.filter_width = 0.01; materials('ids'); set_world(sc, (0, 0, 0), 0); freestyle(sc, False); render(sc, f'{OUT}/{NAME}-ids.png')
sc.cycles.filter_width = 1.5; materials('white'); set_world(sc, (1, 1, 1), 1); freestyle(sc, True); render(sc, f'{OUT}/{NAME}-lines.png')
sc.cycles.samples = 24; sc.cycles.use_denoising = True; materials('light'); set_world(sc, (0.25, 0.25, 0.25), 1); freestyle(sc, False); render(sc, f'{OUT}/{NAME}-light.png')
srgb = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055   # the PNG is sRGB-encoded
import json; json.dump({k: [round(srgb(c) * 255) for c in v] for k, v in PARTS.items()}, open(f'{OUT}/{NAME}-ids.json', 'w'), indent=1)
print('done', NAME)
