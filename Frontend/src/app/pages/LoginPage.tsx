import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Atom, ArrowRight } from "lucide-react";

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();

    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      // Draw edges
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < 200) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  return (
    <div className="h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left branding */}
      <div className="hidden lg:flex flex-1 bg-qp-navy relative items-center justify-center overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 max-w-sm px-8">
          <div className="flex items-center gap-2 mb-8">
            <Atom className="w-7 h-7 text-qp-cyan" />
            <span className="text-white" style={{ fontSize: "20px", fontWeight: 600 }}>QuantumProj</span>
          </div>
          <h2 className="text-white mb-4" style={{ fontSize: "26px", fontWeight: 600, lineHeight: 1.2 }}>
            Spatial decision intelligence for critical systems.
          </h2>
          <p className="text-white/50" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            Model risk propagation, optimize interventions, and benchmark solver integrity across classical and quantum approaches.
          </p>
        </div>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Atom className="w-5 h-5 text-qp-cyan" />
            <span style={{ fontSize: "15px", fontWeight: 600 }}>QuantumProj</span>
          </div>

          <h1 className="text-foreground mb-1" style={{ fontSize: "22px", fontWeight: 600 }}>Welcome back</h1>
          <p className="text-muted-foreground mb-8" style={{ fontSize: "13px" }}>Sign in to your workspace</p>

          {/* SSO */}
          <button className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2.5 hover:bg-muted transition-colors mb-3" style={{ fontSize: "13px" }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2.5 hover:bg-muted transition-colors mb-6" style={{ fontSize: "13px" }}>
            <Shield className="w-4 h-4" />
            Continue with SSO
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground" style={{ fontSize: "12px" }}>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/app");
            }}
          >
            <div className="mb-4">
              <label className="block mb-1.5 text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-qp-cyan/30 focus:border-qp-cyan transition-colors"
                style={{ fontSize: "13px" }}
                placeholder="you@company.com"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1.5 text-foreground" style={{ fontSize: "13px", fontWeight: 500 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-qp-cyan/30 focus:border-qp-cyan transition-colors"
                style={{ fontSize: "13px" }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-qp-navy text-white py-2.5 rounded-lg hover:bg-qp-slate transition-colors flex items-center justify-center gap-2"
              style={{ fontSize: "14px" }}
            >
              Sign in <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-6" style={{ fontSize: "12px" }}>
            Don't have an account?{" "}
            <Link to="/" className="text-qp-cyan hover:underline">Request access</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  );
}
