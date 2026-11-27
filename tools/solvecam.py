import numpy as np, sys, json
from scipy.optimize import least_squares
def project(params, P, W, H):
    cx, cy, cz, yaw, pitch, hfov = params
    # yaw: compass heading in degrees (0 = north = -z, 90 = east = +x); pitch: degrees, negative = looking down
    yr, pr = np.radians(yaw), np.radians(pitch)
    fwd = np.array([np.sin(yr) * np.cos(pr), np.sin(pr), -np.cos(yr) * np.cos(pr)])
    right = np.array([np.cos(yr), 0, np.sin(yr)])
    up = np.cross(right, fwd)
    f = (W / 2) / np.tan(np.radians(hfov) / 2)
    out = []
    for p in P:
        d = np.array(p) - np.array([cx, cy, cz])
        z = d @ fwd
        u = W / 2 + f * (d @ right) / z
        v = H / 2 - f * (d @ up) / z
        out.append((u, v))
    return np.array(out)
def solve(points, W, H, x0):
    P = [p for p, _ in points]; O = np.array([o for _, o in points])
    r = lambda prm: (project(prm, P, W, H) - O).ravel()
    best = None
    for dy in [0, 20, -20]:
        for dyaw in [0, 20, -20]:
            g = np.array(x0, float); g[1] += dy; g[3] += dyaw
            s = least_squares(r, g, bounds=([-500, 0.5, -500, -360, -89, 20], [700, 400, 700, 720, 60, 130]))
            if best is None or s.cost < best.cost: best = s
    return best, project(best.x, P, W, H), O
if __name__ == '__main__':
    cfg = json.load(open(sys.argv[1]))
    s, pred, obs = solve([(tuple(p), tuple(o)) for p, o in cfg['points']], cfg['W'], cfg['H'], cfg['x0'])
    cx, cy, cz, yaw, pitch, hfov = s.x
    print('cam (%.1f, %.1f, %.1f) yaw %.1f pitch %.1f hfov %.1f  rms %.1f px' % (cx, cy, cz, yaw, pitch, hfov, np.sqrt(np.mean((pred - obs) ** 2))))
    for (p, o), q in zip(cfg['points'], pred): print(p, 'obs', o, 'pred', [round(v) for v in q])
    yr, pr = np.radians(yaw), np.radians(pitch)
    fwd = np.array([np.sin(yr) * np.cos(pr), np.sin(pr), -np.cos(yr) * np.cos(pr)])
    tgt = np.array([cx, cy, cz]) + fwd * 60
    vf = 2 * np.degrees(np.arctan(np.tan(np.radians(hfov) / 2) * cfg['H'] / cfg['W']))
    print('VIEW pos [%.1f, %.1f, %.1f] tgt [%.1f, %.1f, %.1f] vfov %.1f' % (cx, cy, cz, *tgt, vf))
