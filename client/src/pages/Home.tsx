import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Zap, Network, BarChart3, Code2, Shield, Workflow } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-blueprint">Swarm Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name || user?.email}</span>
                <Button onClick={() => setLocation("/dashboard")}>
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-blueprint mb-6 leading-tight">
            Ultimate Multi-Agent<br />
            <span className="gradient-text">Orchestration Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Coordinate, monitor, and scale swarms of AI agents working together on complex tasks. 
            Built with 100+ open-source AI projects for maximum flexibility and power.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg" onClick={() => setLocation("/dashboard")}>
                  Enter Platform
                </Button>
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="divider-blueprint" />

        {/* Features Grid */}
        <section className="mt-20">
          <h2 className="text-4xl font-bold text-blueprint text-center mb-12">
            Powerful Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <Network className="w-8 h-8 text-accent-cyan flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Agent Registry</h3>
                  <p className="text-sm text-muted-foreground">
                    Catalog and manage AI agents with comprehensive metadata, capabilities, and real-time health monitoring.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <Workflow className="w-8 h-8 text-accent-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Workflow Builder</h3>
                  <p className="text-sm text-muted-foreground">
                    Design complex multi-agent workflows with hierarchical, sequential, concurrent, and mesh patterns.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Real-time Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Track agent performance, execution logs, and system metrics with live dashboards and alerts.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <Code2 className="w-8 h-8 text-accent-cyan flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Open-Source Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with 100+ AI projects including LangChain, CrewAI, AutoGPT, and more.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 5 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-accent-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Consensus Mechanisms</h3>
                  <p className="text-sm text-muted-foreground">
                    Implement voting, judge-based, and mixture-of-agents consensus for robust decision-making.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 6 */}
            <Card className="card-technical">
              <div className="flex items-start gap-4">
                <Zap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Task Orchestration</h3>
                  <p className="text-sm text-muted-foreground">
                    Distribute work across agent swarms with priority queues, retries, and failure handling.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <div className="divider-blueprint" />

        {/* Architecture Section */}
        <section className="mt-20">
          <h2 className="text-4xl font-bold text-blueprint text-center mb-12">
            Enterprise Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4">Multi-Agent Patterns</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent-cyan">▸</span>
                  <span>Hierarchical orchestration with leader-follower models</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-cyan">▸</span>
                  <span>Sequential workflows for step-by-step task execution</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-cyan">▸</span>
                  <span>Concurrent processing for parallel agent execution</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-cyan">▸</span>
                  <span>Mesh networks for peer-to-peer agent communication</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent-pink/5 border border-accent-pink/20 rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4">Advanced Features</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent-pink">▸</span>
                  <span>Real-time agent communication with message passing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-pink">▸</span>
                  <span>Distributed consensus for collaborative decision-making</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-pink">▸</span>
                  <span>Comprehensive logging and execution history</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-pink">▸</span>
                  <span>Multi-LLM support with provider abstraction</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="divider-blueprint" />

        {/* CTA Section */}
        <section className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-blueprint mb-6">
            Ready to Build Your Swarm?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start orchestrating powerful multi-agent systems today. Our platform provides everything you need to coordinate, monitor, and scale AI agent swarms.
          </p>
          {isAuthenticated ? (
            <Button size="lg" onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
            </Button>
          ) : (
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Get Started for Free</a>
            </Button>
          )}
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>Ultimate Swarm Agents Platform • Built with 100+ Open-Source AI Projects</p>
          <p className="mt-2">© 2026 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
