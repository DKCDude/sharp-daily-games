import { Button } from "@/components/ui/button";
import { Grid3X3 } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { HowToPlayDialog } from "@/components/how-to-play-dialog";

export default function LoginPage() {
  const { login } = useAuth();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-lg text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Crossnumbers</h1>
          <p className="text-muted-foreground text-lg">A daily math puzzle. Sharp, focused, hand-crafted.</p>
        </div>
        
        <div className="pt-4 space-y-3">
          <Button onClick={() => login()} size="lg" className="w-full text-base font-medium h-12">
            Sign in to play
          </Button>
          <div className="flex justify-center">
            <HowToPlayDialog />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Sign in with your Replit account to save your streak and compete on the leaderboard.
        </p>
      </div>
    </div>
  );
}
