'use strict';
/* the models pack: where each model comes from and how build.js turns it into models/pack/<id>.glb.
   sources: poly.pizza id (pid), title, author and licence as the page shows them (build.js --fetch checks the licence again); also: a note for the licence list.
   models: src the source; yaw degrees about +y that bring its front to +x (pca: after turning its long axis to x); len: its length in m; paint the materials (names as regexes, or indices) that take the
   side's colour; nodes [regex on the source node name, part]; split rules on the connected pieces left (in 0..1 of the model's box: cx cy cz
   the piece's centre, lo hi its bottom and top, x0 x1 its back and front; long: longer on x than that many times its other sides); def the
   part of whatever is left; paintLum [lo, hi]: also the triangles of that luminance (a textured source, one material); grip [x, y, z] in 0..1 of the box: the pivot (a weapon's hand); rig: a skinned character, anims { source clip: short name }; budget: the triangle cap it is warned over */
/* the Quaternius tanks' nodes, and the rules that split a tank or a wheeled vehicle made in one piece */
const Q = [['Turret', 'turret'], ['Gun', 'gun'], ['TrackMesh', 'track'], ['Tank_body', 'hull']];
const TANK = [{ part: 'gun', long: 3, lo: [.4, 1], x1: [.7, 1.01], cz: [.3, .7] }, { part: 'track', hi: [0, .55], cz: [0, .2] }, { part: 'track', hi: [0, .55], cz: [.8, 1] }, { part: 'turret', lo: [.5, 1], cx: [.12, .88], cz: [.15, .85] }];
const WHEELS = [{ part: 'wheel', hi: [0, .55], cz: [0, .22] }, { part: 'wheel', hi: [0, .55], cz: [.78, 1] }];
module.exports = {
  sources: [
    { pid: "FA5daiyZQq", title: "Tank", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "cW3zvvkMOM", title: "Tank", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "uYHpj7lz1J", title: "Tank", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "jWS1CLA0RO", title: "Tank", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "41Tq_Kf0Tui", title: "Tank", author: "Nico _", lic: "CC-BY 3.0" },
    { pid: "4t0RMXCl_Ud", title: "Tank", author: "Poly by Google", lic: "CC-BY 3.0" },
    { pid: "7GG1xDtc8l", title: "Tank", author: "Zsky", lic: "CC-BY 3.0" },
    { pid: "CAZeAFrhC7", title: "Tank", author: "PabloLuna57", lic: "CC-BY 3.0", also: "o mesmo arquivo publicado por KolosStudios em https://poly.pizza/m/egcLMSGiuA (CC-BY 3.0), crédito aos dois" },
    { pid: "AcSdGGrgYP", title: "Jeep", author: "Zsky", lic: "CC-BY 3.0" },
    { pid: "Ebryot9iKM", title: "Humvee", author: "madtrollstudio", lic: "CC-BY 3.0" },
    { pid: "EWp0hGvZPV", title: "Truck", author: "Zsky", lic: "CC-BY 3.0" },
    { pid: "9SwnIlPjNv", title: "Military Motorbike", author: "Zsky", lic: "CC-BY 3.0" },
    { pid: "3XAD5t0Djqv", title: "Military Truck - 2D/3D Collab", author: "Alex Safayan", lic: "CC-BY 3.0" },
    { pid: "y8lBpvMlim", title: "M939 Truck", author: "J-Toastie", lic: "CC-BY 3.0" },
    { pid: "qn4grQgHm8", title: "Pickup Truck", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "xsMtZhBkxL", title: "SUV", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "Cz6yDaUcM9", title: "Car", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "3Eio09miiAF", title: "Predator Drone", author: "sftwr314r8", lic: "CC-BY 3.0" },
    { pid: "Btfn3G5Xv4", title: "SWAT", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "HMnuH5geEG", title: "Man", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "9kF7eTDbhO", title: "Animated Woman", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "vx8dQfkzNM", title: "M4 Carbine", author: "AdamKokrito", lic: "CC-BY 3.0" },
    { pid: "K2lXTYFSLC", title: "Assault Rifle", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "ntijptIGIw", title: "Kar98k", author: "AdamKokrito", lic: "CC-BY 3.0" },
    { pid: "nsP3JukU73", title: "Submachine Gun", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "eJNzLpBsEt", title: "Bazooka", author: "CreativeTrio", lic: "CC0 1.0" },
    { pid: "2IabhRwQkCt", title: "Bazooka", author: "Poly by Google", lic: "CC-BY 3.0" },
    { pid: "2qqg9SbrsZ", title: "RPG Launcher", author: "austincford", lic: "CC-BY 3.0" },
    { pid: "1aIZys4mhg", title: "Frag Grenade West", author: "Pichuliru", lic: "CC0 1.0" },
    { pid: "LW3jwpPfiN", title: "Sack Trench", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "iHyRewQQcN", title: "Sack Trench Small", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "3OEFd1AWfa", title: "Crate", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "4QQwW16WZZT", title: "WW2 Ammo box", author: "Carwyn Pelley", lic: "CC-BY 3.0" },
    { pid: "TLsXd9efLC", title: "Oil Drum", author: "Zsky", lic: "CC-BY 3.0" },
    { pid: "5Cg2oW7EFn", title: "Concrete Barrier", author: "J-Toastie", lic: "CC-BY 3.0" },
    { pid: "Uu0PXwt2nU", title: "Hedgehog", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "vQANVbSE0v", title: "Military Tent", author: "KolosStudios", lic: "CC-BY 3.0" },
    { pid: "Y67erogmR9", title: "Broken Car", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "WrIiMMxyEP", title: "Debris Pile", author: "Quaternius", lic: "CC0 1.0" },
    { pid: "PtqkseZo9O", title: "Landmine", author: "Quaternius", lic: "CC0 1.0" },
  ],
  models: {
    /* tanks: the Quaternius ones come in parts; the others are split by their pieces (TANK) */
    tk_pz4: { src: 'FA5daiyZQq', yaw: 180, paint: ['^Main(_Light|_Dark)?$'], nodes: Q },
    tk_t34: { src: 'cW3zvvkMOM', yaw: 180, paint: ['^Main(_Light|_Dark)?$'], nodes: Q },
    tk_tiger: { src: 'uYHpj7lz1J', yaw: 180, paint: ['^Main(_Light|_Dark)?$'], nodes: Q, budget: 12000 },
    tk_t55: { src: 'jWS1CLA0RO', yaw: 180, paint: ['^Main(_Light|_Dark)?$'], nodes: Q },
    tk_sherman: { src: '41Tq_Kf0Tui', pca: 1, yaw: 0, paint: [0, 3], split: TANK },
    tk_abrams: { src: '4t0RMXCl_Ud', pca: 1, yaw: -16, len: 9.8, paint: [0], split: TANK },
    tk_leo: { src: '7GG1xDtc8l', yaw: 90, paint: [1, 3], split: [TANK[0], TANK[1], TANK[2], { part: 'turret', lo: [.36, 1], cx: [.12, .88], cz: [.15, .85] }] },
    tk_t72: { src: 'CAZeAFrhC7', pca: 1, yaw: 0, paint: [0, 3], split: TANK },
    /* wheeled: hull and wheels */
    car_jeep: { src: 'AcSdGGrgYP', yaw: 90, paint: [0, 7], split: WHEELS },
    car_hmmwv: { src: 'Ebryot9iKM', yaw: 0, paintLum: [.32, 1], split: WHEELS },
    car_scout: { src: 'EWp0hGvZPV', yaw: 90, paint: [2], split: WHEELS },
    moto: { src: '9SwnIlPjNv', yaw: 90, paint: [0] },
    trk_hemtt: { src: '3XAD5t0Djqv', yaw: 90, paint: ['^Truck'], split: WHEELS },
    trk_m939: { src: 'y8lBpvMlim', yaw: 180, paint: ['^Body', 'seats', 'BackCovering'], nodes: [['wheel', 'wheel']], split: WHEELS, budget: 10000 },
    pickup: { src: 'qn4grQgHm8', yaw: 90, nodes: [['Wheel', 'wheel']] },
    suv: { src: 'xsMtZhBkxL', yaw: 90, nodes: [['Wheel', 'wheel']] },
    sedan: { src: 'Cz6yDaUcM9', yaw: 90, nodes: [['Wheel', 'wheel']] },
    drone: { src: '3Eio09miiAF', pca: 1, yaw: 0, len: 8, paint: [0] },
    /* people */
    soldier: { src: 'Btfn3G5Xv4', rig: 1, yaw: 90, paint: ['^Swat$'], anims: { Idle_Gun: 'idle', Idle_Gun_Pointing: 'aim', Idle_Gun_Shoot: 'fire', Gun_Shoot: 'shot', Walk: 'walk', Run: 'run', Run_Shoot: 'runfire', Death: 'death', Roll: 'roll', HitRecieve: 'hit' } },
    civ_man: { src: 'HMnuH5geEG', rig: 1, yaw: 90, anims: { Man_Idle: 'idle', Man_Walk: 'walk', Man_Run: 'run', Man_Death: 'death', Man_Sitting: 'sit' } },
    civ_woman: { src: '9kF7eTDbhO', rig: 1, yaw: 90, anims: { Idle: 'idle', Walking: 'walk', Running: 'run', Death: 'death', SitIdle: 'sit' } },
    /* weapons: the muzzle to +x, the pivot at the hand */
    w_m4: { src: 'vx8dQfkzNM', pca: 1, yaw: 0, len: .84, grip: [.38, .3, .5], budget: 2500 },
    w_ak: { src: 'K2lXTYFSLC', pca: 1, yaw: 0, len: .88, grip: [.38, .3, .5], budget: 2500 },
    w_kar98: { src: 'ntijptIGIw', pca: 1, yaw: 0, len: 1.1, grip: [.32, .3, .5], budget: 2500 },
    w_smg: { src: 'nsP3JukU73', pca: 1, yaw: 0, len: .85, grip: [.38, .3, .5], budget: 2500 },
    w_bazooka: { src: 'eJNzLpBsEt', pca: 1, yaw: 0, len: 1.4, grip: [.45, .3, .5], budget: 2500 },
    w_launcher: { src: '2IabhRwQkCt', pca: 1, yaw: 180, len: 1.0, grip: [.45, .3, .5], budget: 2500 },
    w_rpg: { src: '2qqg9SbrsZ', pca: 1, yaw: 180, len: .95, grip: [.45, .3, .5], budget: 2500 },
    w_grenade: { src: '1aIZys4mhg', len: .1, grip: [.5, .5, .5], budget: 1000 },
    /* the field */
    p_sandbags: { src: 'LW3jwpPfiN', pca: 1, len: 3 },
    p_nest: { src: 'iHyRewQQcN', pca: 1, len: 2.3 },
    p_crate: { src: '3OEFd1AWfa', len: .8 },
    p_ammo: { src: '4QQwW16WZZT', pca: 1, len: .55 },
    p_drum: { src: 'TLsXd9efLC', len: .6 },
    p_barrier: { src: '5Cg2oW7EFn', pca: 1, len: 2 },
    p_hedgehog: { src: 'Uu0PXwt2nU', len: 1.6 },
    p_tent: { src: 'vQANVbSE0v', pca: 1, len: 6 },
    p_wreck: { src: 'Y67erogmR9', pca: 1, len: 4.4 },
    p_debris: { src: 'WrIiMMxyEP', len: 2.6 },
    p_mine: { src: 'PtqkseZo9O', len: .35 }
  }
};
