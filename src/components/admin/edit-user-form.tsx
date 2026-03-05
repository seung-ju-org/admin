"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { extractErrorMessage } from "@/lib/error-message";
import { type Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const USER_QUERY = gql`
  query User($userId: ID!) {
    user(userId: $userId) {
      id
      username
      email
      name
      role
    }
  }
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($userId: ID!, $username: String, $email: String, $name: String, $password: String) {
    updateUser(userId: $userId, username: $username, email: $email, name: $name, password: $password) {
      id
    }
  }
`;

type Props = {
  userId: string;
  messages: Messages["usersManager"];
};

type UserQueryData = {
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: "ADMIN" | "USER";
  } | null;
};

export function EditUserForm({ userId, messages }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const { data, loading, error } = useQuery<UserQueryData>(USER_QUERY, {
    variables: { userId },
    fetchPolicy: "network-only",
  });
  const [updateUser, { loading: isUpdating }] = useMutation(UPDATE_USER_MUTATION);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const nextPassword = String(formData.get("password") ?? "").trim();

    try {
      await updateUser({
        variables: {
          userId,
          name: name || null,
          password: nextPassword || null,
        },
      });

      toast.success(messages.updateSuccess);
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error) ?? messages.updateError);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{messages.edit}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{messages.edit}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{messages.loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.edit}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
          <div className="space-y-2">
            <Label htmlFor="edit-username">{messages.username}</Label>
            <Input
              id="edit-username"
              defaultValue={data.user.username}
              disabled
              name="username"
              placeholder={messages.usernamePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">{messages.name}</Label>
            <Input
              id="edit-name"
              defaultValue={data.user.name ?? ""}
              name="name"
              placeholder={messages.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">{messages.email}</Label>
            <Input
              id="edit-email"
              defaultValue={data.user.email ?? ""}
              disabled
              name="email"
              placeholder={messages.emailPlaceholder}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">{messages.password}</Label>
            <Input
              id="edit-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.passwordPlaceholder}
              type="password"
              value={password}
            />
          </div>
          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/users")} type="button" variant="ghost">
              {messages.backToList}
            </Button>
            <Button className="w-full sm:w-auto" disabled={isUpdating} type="submit">
              {messages.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
