import { BookOpen, Globe, Users, Target } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About Ayat Nabil</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dedicated to helping students achieve fluency and confidence in English through personalized,
            effective teaching methods backed by years of experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img
              src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Teaching Environment"
              className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Me?</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              With over 10 years of experience as an English teacher and professional translator,
              I've helped hundreds of students transform their English abilities. My approach combines
              academic excellence with practical, real-world application.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Whether you're preparing for exams, advancing your career, or simply wanting to communicate
              more confidently, I provide personalized instruction tailored to your specific needs and goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">IELTS Preparation</span>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">Business English</span>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">Translation</span>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">Conversation</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Expert Teaching</h4>
            <p className="text-gray-600 text-sm">Proven methods for rapid improvement</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Personalized</h4>
            <p className="text-gray-600 text-sm">Lessons adapted to your level and goals</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Translation</h4>
            <p className="text-gray-600 text-sm">Professional English-Arabic translation</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Results-Driven</h4>
            <p className="text-gray-600 text-sm">Focus on achieving your objectives</p>
          </div>
        </div>
      </div>
    </section>
  );
}
