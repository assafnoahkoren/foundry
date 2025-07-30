import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Settings, Activity } from 'lucide-react';

export default function BackofficeHome() {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: '+12% from last month',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Sessions',
      value: '89',
      description: 'Currently online',
      icon: Activity,
      color: 'text-green-600',
    },
    {
      title: 'Documents',
      value: '456',
      description: '23 pending review',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: 'System Health',
      value: '98.5%',
      description: 'All systems operational',
      icon: Settings,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Backoffice Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the backoffice management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions performed in the backoffice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm">
                    User action placeholder {i}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i} minutes ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}