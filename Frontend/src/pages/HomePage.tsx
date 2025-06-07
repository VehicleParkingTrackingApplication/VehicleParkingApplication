import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>Welcome to Car Parking System</CardHeader>
        <CardContent>
          <p>This is the homepage. You are logged in!</p>
        </CardContent>
      </Card>
    </div>
  );
}