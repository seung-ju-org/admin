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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($username: String!, $email: String, $name: String, $password: String!, $role: Role!) {
    createUser(username: $username, email: $email, name: $name, password: $password, role: $role) {
      id
    }
  }
`;

type RoleValue = "ADMIN" | "USER";

type Props = {
  messages: Messages["usersManager"];
};

export function CreateUserForm({ messages }: Props) {
  const router = useRouter();
  const [createUser, { loading: isCreating }] = useMutation(CREATE_USER_MUTATION);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleValue>("USER");

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    try {
      await createUser({
        variables: {
          username: username.trim(),
          email: email.trim() || null,
          name: name.trim() || null,
          password,
          role,
        },
      });

      toast.success(messages.createSuccess);
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error) ?? messages.createError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.create}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="space-y-2">
            <Label htmlFor="new-username">{messages.username}</Label>
            <Input
              id="new-username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder={messages.usernamePlaceholder}
              value={username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-name">{messages.name}</Label>
            <Input
              id="new-name"
              onChange={(event) => setName(event.target.value)}
              placeholder={messages.namePlaceholder}
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">{messages.email}</Label>
            <Input
              id="new-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={messages.emailPlaceholder}
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{messages.password}</Label>
            <Input
              id="new-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.passwordPlaceholder}
              type="password"
              value={password}
            />
          </div>
          <div className="space-y-2">
            <Label>{messages.role}</Label>
            <Select onValueChange={(value) => setRole(value as RoleValue)} value={role}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{messages.roleUser}</SelectItem>
                <SelectItem value="ADMIN">{messages.roleAdmin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/users")} type="button" variant="ghost">
              {messages.backToList}
            </Button>
            <Button className="w-full sm:w-auto" disabled={isCreating} type="submit">
              {messages.create}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
