"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { extractErrorMessage } from "@/lib/error-message";
import { type Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($userId: ID!, $username: String, $email: String, $name: String, $password: String) {
    updateUser(userId: $userId, username: $username, email: $email, name: $name, password: $password) {
      id
    }
  }
`;

type Props = {
  userId: string;
  initial: {
    username: string;
    name: string;
    email: string;
  };
  title: string;
  messages: Messages["usersManager"];
};

export function AccountProfileForm({ userId, initial, title, messages }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [name, setName] = useState(initial.name);

  const [updateUser, { loading: isUpdating }] = useMutation(UPDATE_USER_MUTATION);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateUser({
        variables: {
          userId,
          name: name.trim() || null,
          password: password.trim() || null,
        },
      });

      toast.success(messages.updateSuccess);
      setPassword("");
      router.refresh();
    } catch (error) {
      const message = extractErrorMessage(error);
      if (message === "USERNAME_ALREADY_EXISTS") {
        toast.error(messages.createErrorUsernameExists);
        return;
      }
      if (message === "EMAIL_ALREADY_EXISTS") {
        toast.error(messages.createErrorEmailExists);
        return;
      }
      toast.error(message ?? messages.updateError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
          <div className="space-y-2">
            <Label htmlFor="account-username">{messages.username}</Label>
            <Input
              id="account-username"
              disabled
              placeholder={messages.usernamePlaceholder}
              value={initial.username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-name">{messages.name}</Label>
            <Input
              id="account-name"
              onChange={(event) => setName(event.target.value)}
              placeholder={messages.namePlaceholder}
              value={name}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="account-email">{messages.email}</Label>
            <Input
              id="account-email"
              disabled
              placeholder={messages.emailPlaceholder}
              type="email"
              value={initial.email}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="account-password">{messages.password}</Label>
            <Input
              id="account-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.passwordPlaceholder}
              type="password"
              value={password}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button className="w-full sm:w-auto" disabled={isUpdating} type="submit">
              {messages.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
