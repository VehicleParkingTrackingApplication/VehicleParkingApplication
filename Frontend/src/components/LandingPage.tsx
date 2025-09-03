import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Glass Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-2xl transform -translate-x-40"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-400/8 rounded-full blur-3xl"></div>
      </div>
      
      {/* Glass overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-900/20 to-indigo-900/40"></div>
      {/* Navigation */}
      <nav className="px-6 py-4 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-20 h-20 object-contain" />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-blue-300 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-blue-300 transition-colors">Solutions</a>
            <a href="#testimonials" className="hover:text-blue-300 transition-colors">Testimonials</a>
            <a href="#contact" className="hover:text-blue-300 transition-colors">Contact</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-blue-300"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            From Parked Cars to<br />
            <span className="text-yellow-400">Smart Starts</span>
          </h1>
          
          <p className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your parking facility into an intelligent ecosystem with real-time 
            monitoring, automated operations, and data-driven insights for Ultra 
            Smart parking operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-8"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-900 px-8"
            >
              ▶ Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl font-bold text-blue-300 mb-2 drop-shadow-lg">99.9%</div>
              <div className="text-blue-200">Uptime Reliability</div>
            </div>
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl font-bold text-yellow-400 mb-2 drop-shadow-lg">24/7</div>
              <div className="text-blue-200">Real-time Monitoring</div>
            </div>
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">50%</div>
              <div className="text-blue-200">Cost Reduction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 relative z-10">
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features for <span className="text-yellow-400">Smart Parking</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Everything you need to transform your parking facility into a modern, 
              efficient and profitable operation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Real-time Monitoring</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Monitor occupancy levels in real time with live updates from camera sensors and automated alerts.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">🚗</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Smart Alert System</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Automated alerts for unauthorized parking, overstay violations, and system maintenance needs.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">FTP Integration</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Seamless integration with existing camera systems through secure FTP connections and data processing.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">User Access Control</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Role-based access control with admin, staff, and customer permissions for secure operations.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Live Web Dashboard</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Comprehensive web dashboard with real-time analytics, reporting, and management tools.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Advanced Analytics</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                In-depth analytics with usage patterns, revenue optimization, and predictive insights.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">🌐</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">IoT Connectivity</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Connect and integrate with IoT devices for comprehensive parking ecosystem management.
              </p>
            </div>
            
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Automated Operations</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Automated billing, violation detection, and operational workflows to reduce manual overhead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="solutions" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Built for <span className="text-yellow-400">Modern Parking</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Whether you're running a small business parking lot or overseeing 
              multiple facilities, MoniPark adapts to your specific needs and grows with 
              your operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">SMEs & Businesses</h3>
              <p className="text-blue-200 mb-6">
                Perfect for small to medium enterprises looking to optimize their parking 
                operations with professional-grade monitoring and management tools.
              </p>
              <ul className="text-left text-blue-200 space-y-2">
                <li>• Cost-effective solutions</li>
                <li>• Easy implementation</li>
                <li>• Scalable infrastructure</li>
                <li>• 24/7 support</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Security Teams</h3>
              <p className="text-blue-200 mb-6">
                Comprehensive security monitoring with real-time alerts, violation detection, 
                and automated incident reporting for enhanced facility protection.
              </p>
              <ul className="text-left text-blue-200 space-y-2">
                <li>• Real-time alerts</li>
                <li>• Incident management</li>
                <li>• Automated reporting</li>
                <li>• Integration ready</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Facility Customers</h3>
              <p className="text-blue-200 mb-6">
                Enhanced user experience with real-time space availability, automated 
                notifications, and seamless integration with existing customer systems.
              </p>
              <ul className="text-left text-blue-200 space-y-2">
                <li>• Better availability</li>
                <li>• Reduced wait times</li>
                <li>• Mobile integration</li>
                <li>• User-friendly interface</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-2xl">💬</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-8">What Our Customers Say</h2>
          
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <p className="text-lg text-blue-100 mb-6 italic leading-relaxed">
              "MoniPark has completely revolutionized our parking operations. We've 
              seen a 50% reduction in operational costs and our customers love the 
              improved experience. The real-time monitoring gives us peace of 
              mind 24/7."
            </p>
            
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl drop-shadow-lg">★</span>
              ))}
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all duration-300 relative overflow-hidden">
            {/* Additional inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl"></div>
            <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <span className="text-2xl">🚀</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of businesses that have transformed their parking 
              operations and enhance customer experience with MoniPark a 
              personalized demo today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium px-8 shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => navigate('/register')}
              >
                📅 Book a Demo
              </Button>
              <div className="flex items-center justify-center text-blue-300">
                <span className="mr-2">or call us:</span>
                <span className="font-medium text-white">(+61) 123-4567</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/assets/Logo.png" alt="MoniPark" className="w-16 h-16 object-contain" />
              </div>
              <p className="text-blue-300 text-sm">
                Smart parking solutions for modern businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Our Links</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Pricing and Management</a></li>
                <li><a href="#" className="hover:text-white">Risk Solutions</a></li>
                <li><a href="#" className="hover:text-white">About us</a></li>
                <li><a href="#" className="hover:text-white">Opportunities</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Extension</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">Awards</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><a href="#" className="hover:text-white">Customer Feedback</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-400 text-sm">
              © 2024 MoniPark. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-blue-400 hover:text-white text-sm">X</a>
              <a href="#" className="text-blue-400 hover:text-white text-sm">LinkedIn</a>
              <a href="#" className="text-blue-400 hover:text-white text-sm">Instagram</a>
              <a href="#" className="text-blue-400 hover:text-white text-sm">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
