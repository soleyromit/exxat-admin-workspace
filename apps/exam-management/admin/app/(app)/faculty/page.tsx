import type { Metadata } from 'next'
import FacultyClient from './faculty-client'
export const metadata: Metadata = { title: 'Faculty — Exam Management' }
export default function FacultyPage() { return <FacultyClient /> }
