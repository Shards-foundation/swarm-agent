import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"agents" | "workflows" | "tasks">("agents");

  // Fetch agents
  const { data: agents, isLoading: agentsLoading } = trpc.agent.list.useQuery({});

  // Fetch workflows
  const { data: workflows, isLoading: workflowsLoading } = trpc.workflow.list.useQuery({});

  // Fetch unresolved alerts
  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.getUnresolved.useQuery();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please log in to access the swarm platform</p>
          <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const activeAgents = agents?.filter(a => a.status === "active").length || 0;
  const activeWorkflows = workflows?.filter(w => w.status === "active").length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === "critical").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blueprint mb-2">Ultimate Swarm Platform</h1>
              <p className="text-technical text-muted-foreground">Multi-Agent Orchestration & Monitoring</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="font-semibold">{user.name || user.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Key Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-blueprint">System Overview</h2>
          <div className="dashboard-grid">
            <Card className="card-technical">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-technical text-muted-foreground mb-2">ACTIVE AGENTS</p>
                  <p className="stat-value">{activeAgents}</p>
                  <p className="text-sm text-muted-foreground mt-2">of {agents?.length || 0} total</p>
                </div>
                <Zap className="w-8 h-8 text-accent-cyan opacity-60" />
              </div>
            </Card>

            <Card className="card-technical">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-technical text-muted-foreground mb-2">ACTIVE WORKFLOWS</p>
                  <p className="stat-value">{activeWorkflows}</p>
                  <p className="text-sm text-muted-foreground mt-2">of {workflows?.length || 0} total</p>
                </div>
                <Clock className="w-8 h-8 text-accent-pink opacity-60" />
              </div>
            </Card>

            <Card className="card-technical">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-technical text-muted-foreground mb-2">CRITICAL ALERTS</p>
                  <p className="stat-value text-red-500">{criticalAlerts}</p>
                  <p className="text-sm text-muted-foreground mt-2">Requires attention</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-60" />
              </div>
            </Card>
          </div>
        </section>

        <div className="divider-blueprint" />

        {/* Navigation Tabs */}
        <section className="mb-8">
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === "agents"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab("workflows")}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === "workflows"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Workflows
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === "tasks"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Tasks
            </button>
          </div>
        </section>

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blueprint">Agent Registry</h3>
              <Button
                onClick={() => setLocation("/agents/create")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </Button>
            </div>

            {agentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="card-technical cursor-pointer hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{agent.name}</h4>
                        <p className="text-technical text-muted-foreground text-sm">{agent.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.status === "active" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {agent.status}
                        </span>
                      </div>
                    </div>

                    {agent.description && (
                      <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-technical text-xs text-muted-foreground">Health Score</p>
                        <p className="font-bold text-primary">{agent.healthScore?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-technical text-xs text-muted-foreground">Success Rate</p>
                        <p className="font-bold text-primary">{agent.successRate?.toFixed(1)}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-technical text-center py-12">
                <p className="text-muted-foreground mb-4">No agents registered yet</p>
                <Button
                  onClick={() => setLocation("/agents/create")}
                  variant="outline"
                >
                  Create Your First Agent
                </Button>
              </Card>
            )}
          </section>
        )}

        {/* Workflows Tab */}
        {activeTab === "workflows" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blueprint">Workflow Orchestration</h3>
              <Button
                onClick={() => setLocation("/workflows/create")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Workflow
              </Button>
            </div>

            {workflowsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : workflows && workflows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="card-technical cursor-pointer hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{workflow.name}</h4>
                        <p className="text-technical text-muted-foreground text-sm">
                          {workflow.orchestrationPattern}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-muted">
                        {workflow.status}
                      </span>
                    </div>

                    {workflow.description && (
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-technical text-center py-12">
                <p className="text-muted-foreground mb-4">No workflows created yet</p>
                <Button
                  onClick={() => setLocation("/workflows/create")}
                  variant="outline"
                >
                  Create Your First Workflow
                </Button>
              </Card>
            )}
          </section>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <section>
            <h3 className="text-xl font-bold text-blueprint mb-6">Task Execution</h3>
            <Card className="card-technical text-center py-12">
              <p className="text-muted-foreground mb-4">Task execution interface coming soon</p>
              <p className="text-sm text-muted-foreground">Monitor and manage agent task execution</p>
            </Card>
          </section>
        )}

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-bold text-blueprint mb-6">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <Card key={alert.id} className="card-technical">
                  <div className="flex items-start gap-4">
                    {alert.severity === "critical" ? (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      {alert.message && (
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
