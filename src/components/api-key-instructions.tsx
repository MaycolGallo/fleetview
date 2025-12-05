import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2Icon } from "lucide-react";

export function ApiKeyInstructions() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Code2Icon className="w-6 h-6" />
            Google Maps API Key Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            To display the vehicle map, please provide your Google Maps API key.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">1. Create a <code>.env.local</code> file</h3>
              <p className="text-sm text-muted-foreground">In the root directory of your project, create a new file named <code>.env.local</code>.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">2. Add your API Key</h3>
              <p className="text-sm text-muted-foreground">Add the following line to the file, replacing <code>YOUR_API_KEY_HERE</code> with your actual key:</p>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE</code>
              </pre>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            After adding the key, you may need to restart your development server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
