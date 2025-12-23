import { Award, Users, BookOpen, Trophy, Star, CheckCircle } from 'lucide-react';

const achievements = [
  {
    year: '2013',
    title: 'Started Teaching Career',
    description: 'Began professional English teaching journey with passion and dedication'
  },
  {
    year: '2015',
    title: 'Translation Certification',
    description: 'Obtained professional translation certification for English-Arabic'
  },
  {
    year: '2018',
    title: '200+ Students Milestone',
    description: 'Successfully taught and mentored over 200 students'
  },
  {
    year: '2020',
    title: 'Online Teaching Expansion',
    description: 'Expanded services to include comprehensive online teaching programs'
  },
  {
    year: '2023',
    title: '10 Years of Excellence',
    description: 'Celebrating a decade of transforming students English proficiency'
  }
];

const credentials = [
  'Bachelor\'s Degree in English Language',
  'Professional Translation Certificate',
  'IELTS Examiner Training',
  'Business English Specialist',
  'Advanced Teaching Methodology',
  'Continuous Professional Development'
];

export default function Experience() {
  return (
    <section id="experience" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Experience & Achievements</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A decade of dedication to English language education and professional growth
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <Trophy className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Journey Timeline</h3>
            </div>

            <div className="space-y-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm">
                      {achievement.year}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{achievement.title}</h4>
                    <p className="text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-2xl text-white mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Credentials & Qualifications</h3>
              </div>

              <ul className="space-y-4">
                {credentials.map((credential, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{credential}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl text-center">
                <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">500+</div>
                <div className="text-gray-600">Happy Students</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl text-center">
                <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">10,000+</div>
                <div className="text-gray-600">Teaching Hours</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white text-center">
          <Star className="w-16 h-16 mx-auto mb-6 fill-white" />
          <h3 className="text-3xl font-bold mb-4">What Students Say</h3>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            "Ayat Nabil is an exceptional teacher who truly cares about her students' success.
            Her teaching methods are effective, engaging, and tailored to individual needs.
            My English has improved dramatically thanks to her guidance."
          </p>
          <div className="flex items-center justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 fill-white" />
            ))}
          </div>
          <p className="mt-4 text-blue-100">Average rating from 100+ reviews</p>
        </div>
      </div>
    </section>
  );
}
