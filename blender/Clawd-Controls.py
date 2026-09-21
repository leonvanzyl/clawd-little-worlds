bl_info = {'name': 'Clawd Pixel Animator', 'author': 'Clawd project', 'version': (1,0,0), 'blender': (4,4,0), 'location': '3D View > Sidebar > Clawd', 'description': 'Clip library, facial poses, prop sockets and stepped keyframes for the Clawd rig', 'category': 'Animation'}
import bpy, math
from bpy.props import StringProperty, EnumProperty

CLIPS = {'Idle':48,'Wave':48,'Hop':24,'Cheer':48,'Expressions':96,'Drums':96}
def rig(): return bpy.data.objects.get('Clawd | Animator')
def curves(action):
    if not action: return
    for layer in action.layers:
        for strip in layer.strips:
            if hasattr(strip,'channelbags'):
                for bag in strip.channelbags:
                    for fc in bag.fcurves: yield fc
def set_scene_props(visible):
    for n in ('PROPS | Held drumsticks','SCENE | Drum kit','SCENE | Beat accents'):
        c=bpy.data.collections.get(n)
        if c: c.hide_render=not visible; c.hide_viewport=not visible
def face_pose(name):
    d={n:{'location':(0,0,0),'rotation_euler':(0,0,0),'scale':((.001,.001,.001) if n.startswith(('Brow','Mouth')) else (1,1,1))} for n in ('Face','Eye.L','Eye.R','Brow.L','Brow.R','Mouth')}
    if name=='Happy':
        for n in ('Eye.L','Eye.R'): d[n]['scale']=(1,.4,1)
        d['Eye.L']['rotation_euler']=(0,0,math.radians(-20));d['Eye.R']['rotation_euler']=(0,0,math.radians(20))
    elif name=='Surprised':
        for n in ('Eye.L','Eye.R'): d[n]['scale']=(1.25,1.25,1)
        d['Mouth']['scale']=(1,1,1)
    elif name=='Focused':
        for n in ('Eye.L','Eye.R'): d[n]['scale']=(1,.65,1)
        for n in ('Brow.L','Brow.R'): d[n]['scale']=(1,1,1)
        d['Brow.L']['rotation_euler']=(0,0,math.radians(-20));d['Brow.R']['rotation_euler']=(0,0,math.radians(20))
    elif name=='Sleepy':
        for n in ('Eye.L','Eye.R'):d[n]['scale']=(1,.2,1)
    elif name=='Blink':
        for n in ('Eye.L','Eye.R'):d[n]['scale']=(1,.12,1)
    return d
def editable_action(r):
    r.animation_data_create()
    a=r.animation_data.action
    if a is None:
        a=bpy.data.actions.new('Clawd / Custom');r.animation_data.action=a
    elif a.get('Library preset',False):
        a=a.copy();a.name='Clawd / Custom';a['Library preset']=False;r.animation_data.action=a
    return a

class CLAWD_OT_clip(bpy.types.Operator):
    bl_idname='clawd.clip';bl_label='Choose clip';bl_options={'REGISTER','UNDO'}
    clip:StringProperty()
    def execute(self,context):
        r=rig();a=bpy.data.actions.get('Clawd / '+self.clip)
        if not r or not a: return {'CANCELLED'}
        r.animation_data_create();r.animation_data.action=a
        context.scene.frame_start=1;context.scene.frame_end=CLIPS[self.clip];context.scene.render.fps=24
        set_scene_props(self.clip=='Drums');context.scene.frame_set(1)
        return {'FINISHED'}

class CLAWD_OT_face(bpy.types.Operator):
    bl_idname='clawd.face';bl_label='Key expression';bl_options={'REGISTER','UNDO'}
    expression:StringProperty()
    def execute(self,context):
        r=rig()
        if not r:return {'CANCELLED'}
        a=editable_action(r)
        for name,channels in face_pose(self.expression).items():
            pb=r.pose.bones[name]
            for channel,value in channels.items():
                setattr(pb,channel,value);pb.keyframe_insert(data_path=channel,frame=context.scene.frame_current)
        for fc in curves(a):
            for k in fc.keyframe_points:k.interpolation='CONSTANT'
        context.view_layer.update();return {'FINISHED'}

class CLAWD_OT_key(bpy.types.Operator):
    bl_idname='clawd.key';bl_label='Key held pose';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        r=rig()
        if not r:return {'CANCELLED'}
        a=editable_action(r)
        for pb in r.pose.bones:
            for channel in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=channel,frame=context.scene.frame_current)
        for fc in curves(a):
            for k in fc.keyframe_points:k.interpolation='CONSTANT'
        return {'FINISHED'}

class CLAWD_OT_snap(bpy.types.Operator):
    bl_idname='clawd.snap';bl_label='Snap selected controls';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        r=rig()
        if not r:return {'CANCELLED'}
        selected=context.selected_pose_bones or []
        if not selected:self.report({'INFO'},'Select pose controls first');return {'CANCELLED'}
        for pb in selected:
            pb.location=tuple(round(v/.2)*.2 for v in pb.location)
            pb.rotation_euler=tuple(round(v/math.radians(15))*math.radians(15) for v in pb.rotation_euler)
        return {'FINISHED'}

class CLAWD_OT_attach(bpy.types.Operator):
    bl_idname='clawd.attach';bl_label='Attach selected prop';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        r=rig()
        if not r:return {'CANCELLED'}
        objects=[o for o in context.selected_objects if o!=r and o.type in {'MESH','EMPTY','CURVE'} and not o.name.startswith('Clawd /')]
        if not objects:self.report({'INFO'},'Select a separate prop object in Object Mode first');return {'CANCELLED'}
        context.view_layer.update()
        for ob in objects:
            world=ob.matrix_world.copy();ob.parent=r;ob.parent_type='BONE';ob.parent_bone=context.scene.clawd_socket
            context.view_layer.update();ob.matrix_world=world
        return {'FINISHED'}

class CLAWD_PT_panel(bpy.types.Panel):
    bl_label='Clawd Pixel Animator';bl_idname='CLAWD_PT_panel';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Clawd'
    def draw(self,context):
        l=self.layout
        if not rig():l.label(text='Open Clawd-Animator.blend');return
        l.label(text='Animation library')
        grid=l.grid_flow(columns=2,align=True)
        for clip in CLIPS:grid.operator('clawd.clip',text=clip).clip=clip
        l.label(text='Space to play / pause',icon='PLAY')
        l.separator();l.label(text='Key a facial expression')
        grid=l.grid_flow(columns=2,align=True)
        for name in ('Neutral','Happy','Surprised','Focused','Sleepy','Blink'):grid.operator('clawd.face',text=name).expression=name
        l.separator();l.operator('clawd.key',icon='KEY_HLT');l.operator('clawd.snap',icon='SNAP_ON')
        l.label(text='Held poses on a 24 fps timeline')
        l.separator();l.label(text='Props: position first, then attach')
        l.prop(context.scene,'clawd_socket',text='Socket');l.operator('clawd.attach',icon='CONSTRAINT_BONE')

classes=(CLAWD_OT_clip,CLAWD_OT_face,CLAWD_OT_key,CLAWD_OT_snap,CLAWD_OT_attach,CLAWD_PT_panel)
def unregister():
    for cls in reversed(classes):
        old=getattr(bpy.types,cls.__name__,None)
        if old:
            try:bpy.utils.unregister_class(old)
            except RuntimeError:pass
    if hasattr(bpy.types.Scene,'clawd_socket'):del bpy.types.Scene.clawd_socket
def register():
    unregister()
    for cls in classes:bpy.utils.register_class(cls)
    bpy.types.Scene.clawd_socket=EnumProperty(name='Prop socket',items=[(n,n,'') for n in ('Grip.L','Grip.R','Attach.Head','Attach.Back')])
if __name__=='__main__':register()
