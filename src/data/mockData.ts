// Mock data for Compassion Safe
import { User, Admin, Category } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    childNumber: 'CS001',
    password: 'TempPass123!',
    fullName: 'Sarah Johnson',
    profilePicture: '/placeholder.svg',
    description: 'Bright and creative student with dreams of becoming an artist.',
    isActive: true,
    data: {
      backgroundInformation: {
        age: '12',
        birthDate: '2011-05-15',
        address: '123 Hope Street, Community Center',
        family: 'Lives with grandmother and two siblings'
      },
      homeVisit: {
        livingConditions: 'Small apartment, shared room',
        familySituation: 'Grandmother is primary caregiver',
        needs: 'School supplies and art materials'
      },
      healthRecords: {
        lastCheckup: '2024-01-15',
        vaccinations: 'Up to date',
        conditions: 'Mild asthma, managed with inhaler'
      },
      gifts: {
        received: ['Art supplies set (2023)', 'School backpack (2024)'],
        preferences: 'Art materials, books'
      },
      spiritualDevelopment: {
        attendance: 'Regular at community center',
        activities: 'Children\'s choir, art class'
      },
      academicRecords: {
        grade: '7th Grade',
        performance: 'Above average in arts, average in math',
        favoriteSubjects: 'Art, English Literature'
      },
      careerDream: {
        aspiration: 'Professional Artist or Art Teacher',
        interests: 'Painting, drawing, creative writing'
      },
      commitmentForms: {
        sponsorshipStart: '2022-09-01',
        monthlySupport: '$45'
      }
    }
  },
  {
    id: '2',
    childNumber: 'CS002',
    password: 'TempPass456!',
    fullName: 'Marcus Williams',
    profilePicture: '/placeholder.svg',
    description: 'Enthusiastic athlete with a passion for soccer and helping others.',
    isActive: true,
    data: {
      backgroundInformation: {
        age: '14',
        birthDate: '2009-11-22',
        address: '456 Unity Avenue, East District',
        family: 'Lives with mother and younger sister'
      },
      homeVisit: {
        livingConditions: 'Two-bedroom house, well-maintained',
        familySituation: 'Single mother working two jobs',
        needs: 'Sports equipment and tutoring support'
      },
      healthRecords: {
        lastCheckup: '2024-02-20',
        vaccinations: 'Complete',
        conditions: 'No significant health issues'
      },
      gifts: {
        received: ['Soccer cleats (2023)', 'Study desk (2024)'],
        preferences: 'Sports equipment, educational games'
      },
      spiritualDevelopment: {
        attendance: 'Active participant in youth programs',
        activities: 'Soccer team captain, peer mentoring'
      },
      academicRecords: {
        grade: '9th Grade',
        performance: 'Strong in physical education and science',
        favoriteSubjects: 'Biology, Physical Education'
      },
      careerDream: {
        aspiration: 'Sports Medicine Doctor or Coach',
        interests: 'Soccer, helping injured athletes recover'
      },
      commitmentForms: {
        sponsorshipStart: '2021-06-15',
        monthlySupport: '$50'
      }
    }
  },
  {
    id: '3',
    childNumber: 'CS003',
    password: 'TempPass789!',
    fullName: 'Elena Rodriguez',
    profilePicture: '/placeholder.svg',
    description: 'Quiet and studious with exceptional skills in mathematics.',
    isActive: false,
    data: {
      backgroundInformation: {
        age: '13',
        birthDate: '2010-08-10',
        address: '789 Learning Lane, Central District',
        family: 'Lives with both parents and baby brother'
      },
      homeVisit: {
        livingConditions: 'Small but organized home',
        familySituation: 'Both parents work, financial struggles',
        needs: 'Advanced learning materials and laptop'
      },
      healthRecords: {
        lastCheckup: '2024-01-08',
        vaccinations: 'Up to date',
        conditions: 'Wears glasses, minor vision correction'
      },
      gifts: {
        received: ['Calculator set (2023)', 'Science books (2024)'],
        preferences: 'Educational materials, technology'
      },
      spiritualDevelopment: {
        attendance: 'Regular but quiet participant',
        activities: 'Math tutoring helper, reading club'
      },
      academicRecords: {
        grade: '8th Grade',
        performance: 'Exceptional in mathematics and science',
        favoriteSubjects: 'Advanced Mathematics, Physics'
      },
      careerDream: {
        aspiration: 'Engineer or Computer Scientist',
        interests: 'Problem-solving, building things, coding'
      },
      commitmentForms: {
        sponsorshipStart: '2022-03-01',
        monthlySupport: '$40'
      }
    }
  }
];

export const mockAdmins: Admin[] = [
  {
    id: '1',
    email: 'admin@compassionsafe.org',
    password: 'AdminPass123!',
    role: 'super-admin',
    fullName: 'Dr. Amanda Chen'
  },
  {
    id: '2',
    email: 'coordinator@compassionsafe.org',
    password: 'CoordPass456!',
    role: 'admin',
    fullName: 'Michael Thompson'
  }
];

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Background Information',
    fields: [
      { id: 'age', name: 'Age', type: 'text', required: true },
      { id: 'birthDate', name: 'Birth Date', type: 'text', required: true },
      { id: 'address', name: 'Address', type: 'textarea', required: true },
      { id: 'family', name: 'Family Situation', type: 'textarea', required: false }
    ]
  },
  {
    id: '2',
    name: 'Home Visit',
    fields: [
      { id: 'livingConditions', name: 'Living Conditions', type: 'textarea', required: false },
      { id: 'familySituation', name: 'Family Situation', type: 'textarea', required: false },
      { id: 'needs', name: 'Identified Needs', type: 'textarea', required: false }
    ]
  },
  {
    id: '3',
    name: 'Health Records',
    fields: [
      { id: 'lastCheckup', name: 'Last Medical Checkup', type: 'text', required: false },
      { id: 'vaccinations', name: 'Vaccination Status', type: 'text', required: false },
      { id: 'conditions', name: 'Health Conditions', type: 'textarea', required: false }
    ]
  },
  {
    id: '4',
    name: 'Gifts',
    fields: [
      { id: 'received', name: 'Gifts Received', type: 'textarea', required: false },
      { id: 'preferences', name: 'Gift Preferences', type: 'textarea', required: false }
    ]
  },
  {
    id: '5',
    name: 'Spiritual Development',
    fields: [
      { id: 'attendance', name: 'Program Attendance', type: 'text', required: false },
      { id: 'activities', name: 'Activities Participated', type: 'textarea', required: false }
    ]
  },
  {
    id: '6',
    name: 'Academic Records',
    fields: [
      { id: 'grade', name: 'Current Grade', type: 'text', required: true },
      { id: 'performance', name: 'Academic Performance', type: 'textarea', required: false },
      { id: 'favoriteSubjects', name: 'Favorite Subjects', type: 'text', required: false }
    ]
  },
  {
    id: '7',
    name: 'Career Dream',
    fields: [
      { id: 'aspiration', name: 'Career Aspiration', type: 'text', required: false },
      { id: 'interests', name: 'Interests & Hobbies', type: 'textarea', required: false }
    ]
  },
  {
    id: '8',
    name: 'Commitment Forms/Maps',
    fields: [
      { id: 'sponsorshipStart', name: 'Sponsorship Start Date', type: 'text', required: true },
      { id: 'monthlySupport', name: 'Monthly Support Amount', type: 'text', required: true }
    ]
  }
];