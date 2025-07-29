import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import joniLogo from "../assets/logo.png";

export default function JoniHome() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/hub")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <img 
            src={joniLogo} 
            alt="Joni logo" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-3xl font-bold">Joni Management</h1>
        </div>
      </div>

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
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">System Settings</CardTitle>
            <CardDescription>Configure system parameters</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Reports</CardTitle>
            <CardDescription>View system reports and analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}