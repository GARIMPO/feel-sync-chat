import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface LetterComposerProps {
  onlineUsers: string[];
  currentUser: string;
  onSend: (to: string, text: string) => void;
  onClose: () => void;
}

function LetterForm({ onlineUsers, currentUser, onSend, onClose }: LetterComposerProps) {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");

  const recipients = onlineUsers.filter((u) => u !== currentUser);

  const handleSend = () => {
    if (!to || !text.trim()) return;
    onSend(to, text.trim());
    onClose();
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Para quem?</label>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Selecione alguém" />
          </SelectTrigger>
          <SelectContent>
            {recipients.map((user) => (
              <SelectItem key={user} value={user}>{user}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Sua mensagem</label>
        <Textarea
          placeholder="Escreva algo especial..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px] max-h-[200px] text-sm resize-none"
          autoFocus
        />
      </div>
      <Button
        size="sm"
        className="w-full gap-2"
        disabled={!to || !text.trim()}
        onClick={handleSend}
      >
        <Send className="h-3.5 w-3.5" />
        Enviar Carta
      </Button>
    </div>
  );
}

export default function LetterComposer(props: LetterComposerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && props.onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>✉️ Carta Especial</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <LetterForm {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>✉️ Carta Especial</DialogTitle>
        </DialogHeader>
        <LetterForm {...props} />
      </DialogContent>
    </Dialog>
  );
}
