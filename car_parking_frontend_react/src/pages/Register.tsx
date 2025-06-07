import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Register() {
    const [fields, setFields] = useState({ username: "", password: "", email: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields({ ...fields, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Call your register API here
        alert(JSON.stringify(fields));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
            <CardHeader>Register</CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                name="username"
                placeholder="Username"
                value={fields.username}
                onChange={handleChange}
                required
                />
                <Input
                name="email"
                type="email"
                placeholder="Email"
                value={fields.email}
                onChange={handleChange}
                required
                />
                <Input
                name="password"
                type="password"
                placeholder="Password"
                value={fields.password}
                onChange={handleChange}
                required
                />
                <Button type="submit" className="w-full">
                Register
                </Button>
            </form>
            </CardContent>
        </Card>
        </div>
    );
}