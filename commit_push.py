import subprocess, os
os.chdir(r"c:\Users\Lupe\Documents\GitHub\pw-vault")
out = []
for cmd in [
    ["git", "add", "."],
    ["git", "status", "--short"],
    ["git", "commit", "-m", "feat: dark mode, UI polish, code refactor, security hardening\n\n- Add dark/light theme with system preference detection\n- Improve lock screen, cards, modals, empty states\n- Refactor App.tsx into components, hooks, and lib modules\n- Add master password change flow\n- Harden Worker: CORS, rate limiting, input validation, logout\n- Remove GitHub Pages workflow (Vercel deploys)"],
    ["git", "push"],
]:
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    out.append(f"{' '.join(cmd)}\nRC:{r.returncode}\nOUT:{r.stdout[:1500]}\nERR:{r.stderr[:500]}\n")
open(r"c:\Users\Lupe\Documents\GitHub\pw-vault\push_out.txt", "w").write("\n".join(out))
