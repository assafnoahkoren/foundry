import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function JoniHome() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">

      {/* Welcome Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome to Joni Management Suite</CardTitle>
          <CardDescription>
            Access powerful management tools and administrative features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is the Joni home page. Management features will be implemented here.
          </p>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/joni/users')}
        >
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/joni/settings')}
        >
          <CardHeader>
            <CardTitle className="text-lg">System Settings</CardTitle>
            <CardDescription>Configure system parameters</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/joni/reports')}
        >
          <CardHeader>
            <CardTitle className="text-lg">Reports</CardTitle>
            <CardDescription>View system reports and analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}