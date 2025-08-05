const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const email = localStorage.getItem('email')
    if (!email) {
      throw new Error('No se encontró el email del usuario')
    }
    console.log('Email del usuario:', email)

    const response = await fetch('https://planbackend.us-east-1.elasticbeanstalk.com/api/education/generate-material', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: formData.topic,
        gradeLevel: formData.gradeLevel,
        subject: formData.subject,
        materialType: formData.materialType,
        objectives: formData.objectives,
        email: email
      })
    })

    // ... existing code ...
  } catch (error) {
    console.error('Error al enviar la solicitud:', error)
    setLoading(false)
  }
} 