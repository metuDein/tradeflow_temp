export async function captureChart(elementId = 'chart-container') {
    try {
        const html2canvas = (await import('html2canvas')).default
        const element = document.getElementById(elementId)

        if (!element) {
            console.warn('Chart element not found for screenshot')
            return null
        }

        const canvas = await html2canvas(element, {
            backgroundColor: '#0d0d1a',
            scale: 1,
            useCORS: true,
            allowTaint: false,
            logging: false,
        })

        return canvas.toDataURL('image/jpeg', 0.85)
    } catch (error) {
        console.error('Screenshot failed:', error)
        return null
    }
}