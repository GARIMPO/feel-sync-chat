import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Shield, Plus, Users, Trash2, Copy, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { createPublicRoom, getPublicRooms, deletePublicRoom, type PublicRoom } from "@/store/publicRooms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Index() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [rooms, setRooms] = useState<PublicRoom[]>([]);

  useEffect(() => {
    setRooms(getPublicRooms());
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    const success = createPublicRoom(roomName.trim(), creatorName.trim());
    if (!success) {
      toast.error("Já existe uma sala com esse nome");
      return;
    }
    toast.success(`Sala "${roomName.trim()}" criada!`);
    setRooms(getPublicRooms());
    setShowCreate(false);
    setRoomName("");
    // Navigate as owner
    navigate(`/chat?room=${encodeURIComponent(roomName.trim())}&owner=${encodeURIComponent(creatorName.trim())}&public=true`);
  };

  const handleDeleteRoom = (room: PublicRoom) => {
    deletePublicRoom(room.name, room.creator);
    setRooms(getPublicRooms());
    toast.success(`Sala "${room.name}" removida`);
  };

  const copyLink = (roomName: string) => {
    const url = `${window.location.origin}/chat?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">SecureChat</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Chat em tempo real com criptografia ponta-a-ponta. Mensagens que desaparecem ao recarregar.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full active:scale-[0.97] gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            Criar Sala
          </Button>
          <Button
            variant="outline"
            className="w-full active:scale-[0.97]"
            onClick={() => navigate("/admin")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Painel Admin
          </Button>
        </div>

        {/* Public rooms list */}
        {rooms.length > 0 && (
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 px-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Salas Abertas</span>
            </div>
            {rooms.map((room) => (
              <div
                key={room.name}
                className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm border border-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm truncate">{room.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Criada por <span className="font-medium text-foreground">{room.creator}</span>
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/chat?room=${encodeURIComponent(room.name)}`)}
                    title="Entrar"
                  >
                    <DoorOpen className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyLink(room.name)}
                    title="Copiar link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir sala">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir sala "{room.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>A sala será removida permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRoom(room)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Para entrar em uma sala, use o link compartilhado ou crie a sua.
        </p>
      </div>

      {/* Create room dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Sala
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da sala</label>
              <Input
                placeholder="Ex: Amigos, Família..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                autoFocus
                maxLength={30}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Seu nome (dono da sala)</label>
              <Input
                placeholder="Seu apelido"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                maxLength={20}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Como dono, só você poderá excluir mensagens, apagar histórico e controlar o vídeo.
            </p>
            <Button type="submit" className="w-full" disabled={!roomName.trim() || !creatorName.trim()}>
              Criar e Entrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
