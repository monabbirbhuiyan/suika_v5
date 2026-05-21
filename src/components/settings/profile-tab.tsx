"use client";
import { User } from "@/generated/prisma";
import { authClient } from "@/lib/auth-client";
import { ProfileFormValues, profileSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { UserAvatar } from "../global/user-avatar";
import { Button } from "../ui/button";
import { LineChartIcon, Mail, Text, User2, X } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Props = {
  user: User;
};

const ProfileTab = ({ user }: Props) => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setStatus(null);
    setError(null);

    const updateData: any = {
      name: data.name,
    };

    if (data.bio) {
      updateData.bio = data.bio;
    }

    if (data.image && data.image !== user.image) {
      updateData.image = data.image;
    }

    const { error } = await authClient.updateUser(updateData);

    if (error) {
      setError(error.message || "Failed to update profile");
      toast.error(error.message || "Failed to update profile");
    } else {
      setStatus("Profile updated");
      toast.success("Profile updated successfully");
      router.refresh();
    }
  };

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        profileForm.setValue("image", base64, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  }

  const imagePreview = profileForm.watch("image");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-serif text-xl text-brand-ink">Profile</h3>
        <p className="text-sm text-[#5b766c] mt-1 leading-relaxed">
          How you appear within your Suika experience.
        </p>
      </div>

      <div className="w-full">
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="w-full"
          >
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
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  variant="outline"
                  size="sm"
                  className="border-(--brand-green)/25 text-brand-green hover:bg-brand-green-100/45"
                >
                  Change Photo
                </Button>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col mt-6">
              <div className="space-y-4">
                {/* Name */}
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
                          <Input
                            {...field}
                            className="transition-all duration-200 focus:scale-[1.01] pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* email */}
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
                          <Input
                            {...field}
                            type="email"
                            readOnly
                            className="transition-all duration-200 focus:scale-[1.01] pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Text className="absolute left-3 top-5 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
                          <Textarea
                            {...field}
                            className="transition-all duration-200 focus:scale-[1.01] pl-10"
                          />
                        </div>
                      </FormControl>
                      <span className="text-xs text-muted-foreground">
                        A short reflection. Only visible to you.
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="hover:cursor-pointer bg-brand-green hover:bg-brand-green-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfileTab;
