import { supabase } from './supabase'

// Upload image to Supabase Storage
export async function uploadProofImage(file, userId) {
  if (!file) throw new Error('No file provided')
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
  }
  
  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload an image smaller than 5MB.')
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('proof-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proof-images')
      .getPublicUrl(fileName)
    
    return {
      path: fileName,
      url: publicUrl
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image. Please try again.')
  }
}

// Delete image from Supabase Storage
export async function deleteProofImage(imagePath) {
  try {
    const { error } = await supabase.storage
      .from('proof-images')
      .remove([imagePath])
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

// Submit proof for review
export async function submitProof({ taskField, taskLabel, message, receiptNumber, imageUrl, imagePath }) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const submissionData = {
      user_id: user.id,
      task_field: taskField,
      task_label: taskLabel,
      message: message || null,
      receipt_number: receiptNumber || null,
      image_url: imageUrl,
      image_path: imagePath,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('proof_submissions')
      .insert([submissionData])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Submission error:', error)
    throw new Error('Failed to submit proof. Please try again.')
  }
}

// Get user's submissions
export async function getUserSubmissions(userId) {
  try {
    const { data, error } = await supabase
      .from('proof_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Fetch submissions error:', error)
    return []
  }
}

// Get all pending submissions (for managers)
export async function getPendingSubmissions() {
  try {
    console.log('Fetching pending submissions...')
    
    const { data, error } = await supabase
      .from('proof_submissions')
      .select(`
        *,
        users!proof_submissions_user_id_fkey(email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    
    console.log('Pending submissions query result:', { data, error })
    
    if (error) {
      console.error('Database error fetching submissions:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Fetch pending submissions error:', error)
    return []
  }
}

// Approve or reject submission (for managers)
export async function reviewSubmission(submissionId, status, managerId) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status. Must be "approved" or "rejected".')
  }
  
  try {
    // Start a transaction-like operation
    const { data: submission, error: fetchError } = await supabase
      .from('proof_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (fetchError) throw fetchError
    if (!submission) throw new Error('Submission not found')
    
    // Update submission status
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('proof_submissions')
      .update({
        status,
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // If approved, update the user's bingo progress
    if (status === 'approved') {
      const { error: progressError } = await supabase
        .from('progress')
        .update({
          [submission.task_field]: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', submission.user_id)
      
      if (progressError) throw progressError
      
      // Log the progress change
      const { error: logError } = await supabase
        .from('progress_logs')
        .insert([{
          user_id: submission.user_id,
          manager_id: managerId,
          square_field: submission.task_field,
          action: 'check'
        }])
      
      if (logError) console.warn('Failed to log progress change:', logError)
      
      // Delete the image file to save storage space
      await deleteProofImage(submission.image_path)
    }
    
    return updatedSubmission
  } catch (error) {
    console.error('Review submission error:', error)
    throw new Error('Failed to review submission. Please try again.')
  }
}

// Check if user has already submitted proof for a task
export async function hasExistingSubmission(userId, taskField) {
  try {
    // Get current user if userId not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated for existing submission check')
        return null
      }
      currentUserId = user.id
    }

    const { data, error } = await supabase
      .from('proof_submissions')
      .select('id, status')
      .eq('user_id', currentUserId)
      .eq('task_field', taskField)
      .in('status', ['pending', 'approved'])
      .limit(1)
    
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Check existing submission error:', error)
    return null
  }
}
