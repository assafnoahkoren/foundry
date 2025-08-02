import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function JoniHome() {
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Joni Dashboard</CardTitle>
          <CardDescription>
            Access powerful management tools and administrative features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is the Joni dashboard. Management features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}