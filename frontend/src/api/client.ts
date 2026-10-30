import axios from 'axios'
import type { ChatRequest, ChatResponse, ParsedResume } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export async function uploadResume(file: File): Promise<ParsedResume> {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } catch (error: any) {
    const detail = error.response?.data?.detail || error.message || 'Failed to upload and parse resume.'
    throw new Error(detail)
  }
}

export async function sendMessage(payload: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await axios.post(`${BASE_URL}/chat`, payload)
    return response.data
  } catch (error: any) {
    const detail = error.response?.data?.detail || error.message || 'Failed to get a response from the assistant.'
    throw new Error(detail)
  }
}

export async function getApplications() {
  try {
    const response = await axios.get(`${BASE_URL}/applications`)
    return response.data
  } catch (error: any) {
    const detail = error.response?.data?.detail || error.message || 'Failed to load applications.'
    throw new Error(detail)
  }
}
