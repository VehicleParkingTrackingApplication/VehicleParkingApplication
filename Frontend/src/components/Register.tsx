import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { Footer } from './Footer';

export default function RegisterPage() {
    const nav = useNavigate();
    return (
        <>
            <div className="flex flex-col md:flex-row min-h-screen">
                <div className="flex-1 bg-gradient-to-b from-blue-900 via-black to-yellow-900 flex items-center justify-center p-8">
                    <div className="text-white text-center">
                        <h2 className="text-3xl font-bold mb-2">MoniPark</h2>
                        <p className="opacity-80">"From Parked Cars to Smart Starts"</p>
                        <Button 
                            variant="outline" 
                            className="mt-4" 
                            onClick={() => nav('/')}
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-800 flex items-center justify-center p-8">
                    <Card className="w-full max-w-md bg-gray-700">
                    <CardContent className="space-y-6">
                        <h3 className="text-2xl font-semibold text-center">Register</h3>
                        <Input placeholder="Name" />
                        <Input type="email" placeholder="Email" />
                        <Input type="tel" placeholder="Phone number" />
                        <Input type="password" placeholder="Password" />
                        <Button size="lg" className="w-full" onClick={() => nav('/signin')}>Register</Button>
                        <Button 
                            variant="ghost" 
                            className="w-full" 
                            onClick={() => nav('/signin')}
                        >
                            Already have an account? Sign in
                        </Button>
                    </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}