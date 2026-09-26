"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Text, User2 } from "lucide-react";

import { ProfileFormValues, profileSchema } from "@/lib/schemas";
import { toast } from "@/components/ui/toast";
import { UserAvatar } from "../global/user-avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
}

interface Props {
  user: AppUser;
  onSave?: (section: string) => Promise<void>;
}

const ProfileTab = ({ user, onSave }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image ?? "",
      bio: user.bio || "",
    },
  });

  const imagePreview = watch("image");

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setError(null);

    const updateData: Record<string, string | null> = {
      name: data.name,
      bio: data.bio?.trim() || null,
    };

    if (data.image && data.image !== user.image) {
      updateData.image = data.image;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${user.id}/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      toast.add({
        type: "success",
        description: "Profile updated successfully.",
      });

      if (onSave) {
        await onSave("profile");
      }
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(msg);
      toast.add({
        type: "error",
        description: "Failed to update profile via Python backend.",
        priority: "high",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.add({
          type: "error",
          description: "Image must be less than 2MB.",
          priority: "high",
        });
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setValue("image", base64, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-serif text-xl text-brand-ink">Profile</h3>
        <p className="text-sm text-[#5b766c] mt-1 leading-relaxed">
          How you appear within your Suika experience.
        </p>
      </div>

      <div className="w-full">
        <form onSubmit={handleSubmit(onProfileSubmit)} className="w-full">
          {/* Profile Picture */}
          <div className="flex items-center gap-5">
            {imagePreview && (
              <div className="relative group">
                <UserAvatar
                  name={user.name}
                  image={imagePreview}
                  className="size-24"
                />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-brand-ink">
                Upload a new photo
              </p>
              <p className="text-xs text-[#5f7a70] mt-1 mb-3">
                JPG, PNG or GIF. Max 2MB.
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                onClick={() => document.getElementById("image-upload")?.click()}
                variant="outline"
                size="sm"
                className="border-brand-green/25 text-brand-green hover:bg-brand-green/10"
              >
                Change Photo
              </Button>
            </div>
          </div>

          <div className="flex flex-col mt-6">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[13px] font-medium text-stone-600 block mb-1.5">
                  Full Name
                </label>
                <div className="relative group">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input {...register("name")} className="pl-10" />
                </div>
                {errors.name?.message && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="text-[13px] font-medium text-stone-600 block mb-1.5">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...register("email")}
                    type="email"
                    readOnly
                    className="pl-10 opacity-70 cursor-not-allowed bg-muted/40"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[13px] font-medium text-stone-600 block mb-1.5">
                  Bio
                </label>
                <div className="relative group">
                  <Text className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    {...register("bio")}
                    className="pl-10 resize-none min-h-[90px]"
                    placeholder="A short reflection. Only visible to you."
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  A short reflection. Only visible to you.
                </span>
                {errors.bio?.message && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {String(errors.bio.message)}
                  </p>
                )}
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
