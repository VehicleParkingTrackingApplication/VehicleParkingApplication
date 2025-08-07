import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-screen bg-gradient-to-b from-blue-900 via-black to-yellow-900 flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">From Parked Cars to Smart Starts</h1>
        <p className="max-w-2xl mb-8">
            An AI-driven car park monitoring solution tailored for SMEs — seamlessly integrating Real-Time Occupancy Tracking, Smart Vehicle Analytics, and Automated Visitor Insights. Unlock next-level efficiency by transforming parking spaces into data-powered growth hubs.
        </p>
        <Button size="lg" onClick={() => navigate('/register')}>Getting Started</Button>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-tr from-gray-800 to-gray-700">
            <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold">Parking Slot Analysis</h3>
                <img src="/assets/slot-analysis.png" alt="Analysis" className="rounded-lg" />
                <Tabs defaultValue="employee">
                <TabsList>
                    <TabsTrigger value="employee" onClick={() => navigate('/')}>Employee</TabsTrigger>
                    <TabsTrigger value="admin" onClick={() => navigate('/')}>Admin</TabsTrigger>
                </TabsList>
                </Tabs>
            </CardContent>
            </Card>
            <Card className="bg-gradient-to-tr from-gray-800 to-gray-700 flex flex-col items-center">
            <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold">Parking Slot Analysis</h3>
                <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold">70%</div>
                <img src="/assets/bar-chart.png" alt="Bar Chart" className="h-24" />
                </div>
            </CardContent>
            </Card>
            <div className="flex flex-col space-y-4 justify-center">
            <Avatar><AvatarImage src="/avatars/user1.png" /><AvatarFallback>U1</AvatarFallback></Avatar>
            <Avatar><AvatarImage src="/avatars/user2.png" /><AvatarFallback>U2</AvatarFallback></Avatar>
            <Avatar><AvatarImage src="/avatars/user3.png" /><AvatarFallback>U3</AvatarFallback></Avatar>
            </div>
        </div>
    </section>
  );
}
