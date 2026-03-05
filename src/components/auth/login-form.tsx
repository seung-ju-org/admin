"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { type Locale, type Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMessages = Messages["login"];

type Props = {
  locale: Locale;
  messages: LoginMessages;
};

export function LoginForm({ locale, messages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackUrlParam && callbackUrlParam.startsWith("/")
      ? callbackUrlParam
      : "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsLoading(false);

    if (result?.error) {
      setErrorMessage(result.error || messages.invalidCredentials);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{messages.title}</CardTitle>
        <CardDescription>{messages.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">{messages.usernameLabel}</Label>
            <Input
              autoComplete="username"
              id="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder={messages.usernamePlaceholder}
              value={username}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{messages.passwordLabel}</Label>
            <Input
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.passwordPlaceholder}
              type="password"
              value={password}
            />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <Button className="w-full" disabled={isLoading} lang={locale} type="submit">
            {isLoading ? messages.signingIn : messages.signIn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
