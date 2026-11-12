import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  fetchProfile as fetchProfileRequest,
  saveProfile as saveProfileRequest,
} from "@/lib/profile.functions";
import { useAuth } from "@/lib/auth";
import { fileToResizedDataUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Eventify" },
      { name: "description", content: "Manage your Eventify profile." },
    ],
  }),
  component: Profile,
});

type P = {
  full_name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  bio: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
};

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const loadProfile = useServerFn(fetchProfileRequest);
  const updateProfile = useServerFn(saveProfileRequest);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["profile-full", user?.id],
    enabled: !!user,
    queryFn: () => loadProfile({ data: {} }),
  });
  const [p, setP] = useState<P | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setP(data);
  }, [data]);
  if (isError) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl bg-card p-8 text-center shadow-card">
        <p className="font-semibold">Could not load your profile.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please check your connection and try again."}
        </p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (isPending || !p) return <p className="text-muted-foreground">Loading profile…</p>;
  const set = (k: keyof P) => (e: { target: { value: string } }) =>
    setP({ ...p, [k]: e.target.value });

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        data: {
          full_name: p!.full_name,
          phone: p!.phone?.trim() || null,
          dob: p!.dob || null,
          gender: p!.gender || null,
          address: p!.address?.trim() || null,
          bio: p!.bio?.trim() || null,
          avatar_url: p!.avatar_url,
          email_notifications: p!.email_notifications,
          push_notifications: p!.push_notifications,
        },
      });
      toast.success("Profile saved");
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["profile-full"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-card p-8 shadow-card">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-14 w-14 text-muted-foreground" />
          )}
        </div>
        <Button asChild>
          <label className="cursor-pointer">
            <Camera className="h-4 w-4" /> Upload profile picture
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setP({ ...p, avatar_url: await fileToResizedDataUrl(file, 300) });
              }}
            />
          </label>
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG or GIF</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={p.full_name} onChange={set("full_name")} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={p.email} disabled />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={p.phone ?? ""} onChange={set("phone")} />
        </div>
        <div>
          <Label>Date of birth</Label>
          <Input type="date" value={p.dob ?? ""} onChange={set("dob")} />
        </div>
        <div>
          <Label>Gender</Label>
          <select
            value={p.gender ?? ""}
            onChange={set("gender")}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input value={p.address ?? ""} onChange={set("address")} />
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea rows={4} value={p.bio ?? ""} onChange={set("bio")} />
      </div>
      <h2 className="text-lg font-semibold">Notification preferences</h2>
      <div className="flex flex-wrap gap-10">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={p.email_notifications}
            onCheckedChange={(v) => setP({ ...p, email_notifications: v })}
          />{" "}
          Email notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={p.push_notifications}
            onCheckedChange={(v) => setP({ ...p, push_notifications: v })}
          />{" "}
          Push notifications
        </label>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
