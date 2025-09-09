import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart, Bell, Bot, Code, Cpu, Gauge, Group, Rocket, Shield, Users, Wifi } from 'lucide-react';

// Reusable Feature Card Component for cleaner code
const FeatureCard = ({ icon, title, description, delay }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="relative p-6 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl group transition-all duration-300 hover:bg-white/15"
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
        <p className="text-blue-200 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};


export default function LandingPage() {
  const navigate = useNavigate();
  
  // State to track if the user has scrolled
  const [hasScrolled, setHasScrolled] = useState(false);

  // Effect to add a scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      // Set state to true if scrolled more than 10px, else false
      setHasScrolled(window.scrollY > 10);
    };

    // Add listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup function to remove the listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array ensures this runs only once

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const featureList = [
    { icon: <Gauge size={24} className="text-white" />, title: 'Real-time Monitoring', description: 'Monitor occupancy levels in real time with live updates from camera sensors and automated alerts.' },
    { icon: <Bell size={24} className="text-white" />, title: 'Smart Alert System', description: 'Automated alerts for unauthorized parking, overstay violations, and system maintenance needs.' },
    { icon: <Code size={24} className="text-white" />, title: 'FTP Integration', description: 'Seamless integration with existing camera systems through secure FTP connections and data processing.' },
    { icon: <Users size={24} className="text-white" />, title: 'User Access Control', description: 'Role-based access control with admin, staff, and customer permissions for secure operations.' },
    { icon: <BarChart size={24} className="text-white" />, title: 'Live Web Dashboard', description: 'Comprehensive web dashboard with real-time analytics, reporting, and management tools.' },
    { icon: <Cpu size={24} className="text-white" />, title: 'Advanced Analytics', description: 'In-depth analytics with usage patterns, revenue optimization, and predictive insights.' },
    { icon: <Wifi size={24} className="text-white" />, title: 'IoT Connectivity', description: 'Connect and integrate with IoT devices for comprehensive parking ecosystem management.' },
    { icon: <Bot size={24} className="text-white" />, title: 'Automated Operations', description: 'Automated billing, violation detection, and operational workflows to reduce manual overhead.' },
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
      
      {/* NEW: Top edge gradient fade for smoother scrolling */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-16 z-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(103, 122, 229, 0.6), transparent)' }}
        animate={{ opacity: hasScrolled ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Animated Background Glass Effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"
        ></motion.div>
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-2xl transform -translate-x-40"
        ></motion.div>
         <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl"
        ></motion.div>
        <motion.div
           animate={{ x: [0, -20, 0] }}
           transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-400/8 rounded-full blur-3xl"
        ></motion.div>
      </div>
      
      {/* Glass overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-900/10 to-indigo-900/30"></div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-4 fixed top-0 left-0 right-0 z-50"
      >
        <div className={`
            max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl 
            rounded-2xl px-6 py-2 shadow-xl transition-all duration-300
            ${hasScrolled 
              ? 'bg-slate-900/60 border border-white/20' 
              : 'bg-white/5 border border-white/10'
            }
        `}>
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-16 h-16 object-contain" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-yellow-400 transition-colors">Solutions</a>
            <a href="#testimonials" className="hover:text-yellow-400 transition-colors">Testimonials</a>
            <a href="#contact" className="hover:text-yellow-400 transition-colors">Contact</a>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-yellow-400" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium" onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="px-6 py-20 text-center">
          <motion.div 
            className="max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter">
              From Parked Cars to <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500">
                Smart Starts
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your facility into an intelligent ecosystem with real-time monitoring, automated operations, and data-driven insights.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-8" onClick={() => navigate('/register')}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white hover:text-blue-900 px-8 group">
                Watch Demo <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
              variants={containerVariants}
            >
              {[{val: '99.9%', label: 'Uptime Reliability', color: 'text-blue-300'}, {val: '24/7', label: 'Real-time Monitoring', color: 'text-yellow-400'}, {val: '50%', label: 'Cost Reduction', color: 'text-green-400'}].map((stat, i) => (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl text-center hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className={`text-4xl font-bold ${stat.color} mb-2 drop-shadow-lg`}>{stat.val}</div>
                  <div className="text-blue-200">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24">
           <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                An unfair advantage for <span className="text-yellow-400">Smart Parking</span>
              </h2>
              <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                Everything you need to transform your parking facility into a modern, efficient, and profitable operation.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureList.map((feature, i) => (
                <FeatureCard key={i} icon={feature.icon} title={feature.title} description={feature.description} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Target Audience Section */}
        <section id="solutions" className="px-6 py-24">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Built for <span className="text-yellow-400">Modern Parking Needs</span>
              </h2>
              <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                Whether you're running a small business lot or overseeing multiple facilities, MoniPark adapts and grows with your operations.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Group size={28} />, title: 'SMEs & Businesses', description: 'Optimize your parking operations with professional-grade monitoring and management tools.' },
                { icon: <Shield size={28} />, title: 'Security Teams', description: 'Comprehensive monitoring with real-time alerts, violation detection, and automated incident reporting.' },
                { icon: <Users size={28} />, title: 'Facility Customers', description: 'Enhanced user experience with real-time space availability, and automated notifications.' },
              ].map((solution, i) => (
                <motion.div key={i} variants={itemVariants} className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg hover:bg-white/10 transition-colors">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    {solution.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{solution.title}</h3>
                  <p className="text-blue-200 mb-6">{solution.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="px-6 py-24">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Rocket size={28} />
            </div>
            <h2 className="text-3xl font-bold mb-8">What Our Customers Say</h2>
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">
              <p className="text-lg text-blue-100 mb-6 italic leading-relaxed">
                "MoniPark has completely revolutionized our parking operations. We've seen a 50% reduction in operational costs and our customers love the improved experience. The real-time monitoring gives us peace of mind 24/7."
              </p>
              <div className="flex items-center justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-xl drop-shadow-lg">★</span>)}
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">JE</span>
                </div>
                <div>
                  <div className="font-semibold text-white">James Edison</div>
                  <div className="text-blue-300 text-sm">Operations Manager, Parking Solutions</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24" id="contact">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={itemVariants}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
               <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <Rocket size={28} className="text-black" />
                  </div>
                  <h2 className="text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
                  <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Join hundreds of businesses that have transformed their parking operations. Book a personalized demo today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium px-8 shadow-xl hover:shadow-2xl transition-all duration-300" onClick={() => navigate('/register')}>
                      Book a Demo
                    </Button>
                    <div className="flex items-center justify-center text-blue-300">
                      <span className="mr-2">or call us:</span>
                      <span className="font-medium text-white">(+61) 123-4567</span>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/assets/Logo.png" alt="MoniPark" className="w-16 h-16 object-contain" />
              </div>
              <p className="text-blue-300 text-sm">Smart parking solutions for modern businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Our Links</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Solutions</a></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Sales</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-400 text-sm">© 2025 MoniPark. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-blue-400 hover:text-white text-sm">X</a>
              <a href="#" className="text-blue-400 hover:text-white text-sm">LinkedIn</a>
              <a href="#" className="text-blue-400 hover:text-white text-sm">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}