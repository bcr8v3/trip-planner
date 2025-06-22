// PDF Export functionality for Travel Planner
// Requires jsPDF and html2canvas libraries

class TripPDFExporter {
    constructor() {
        this.loadLibraries();
    }

    // Load required libraries
    loadLibraries() {
        // Load jsPDF
        if (!window.jsPDF) {
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(jsPDFScript);
        }

        // Load html2canvas
        if (!window.html2canvas) {
            const html2canvasScript = document.createElement('script');
            html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(html2canvasScript);
        }
    }

    // Main export function
    async exportTripToPDF(trip) {
        if (!trip) {
            alert('No trip data available for export');
            return;
        }

        try {
            // Show loading state
            this.showLoadingState(true);

            // Wait for libraries to load
            await this.waitForLibraries();

            // Create the PDF
            await this.generatePDF(trip);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            this.showLoadingState(false);
        }
    }    // Wait for required libraries to load
    async waitForLibraries() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait

        while ((!window.jsPDF || !window.html2canvas) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.jsPDF || !window.html2canvas) {
            throw new Error('Required libraries failed to load. Please check your internet connection and try again.');
        }
    }

    // Generate the PDF document
    async generatePDF(trip) {
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // A4 dimensions in mm
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Add title page
        this.addTitlePage(pdf, trip, pageWidth, pageHeight, margin);
        
        // Generate dates for the trip
        const dates = this.generateDateRange(trip.startDate, trip.endDate);
        
        // Create day cards data
        const dayCards = dates.map(date => this.createDayCardData(date, trip));
        
        // Add day cards to PDF
        let currentY = margin;
        let currentPage = 1;
        
        for (let i = 0; i < dayCards.length; i++) {
            const dayCard = dayCards[i];
            
            // Check if we need a new page
            if (i > 0 && (i % 3 === 0 || currentY > pageHeight - 100)) {
                pdf.addPage();
                currentPage++;
                currentY = margin;
            }
            
            // Add day card to current page
            currentY = await this.addDayCardToPDF(pdf, dayCard, margin, currentY, contentWidth);
            currentY += 15; // Space between cards
        }
        
        // Save the PDF
        const fileName = `${trip.name.replace(/[^a-zA-Z0-9]/g, '_')}_itinerary.pdf`;
        pdf.save(fileName);
    }

    // Add title page
    addTitlePage(pdf, trip, pageWidth, pageHeight, margin) {
        const centerX = pageWidth / 2;
        
        // Trip title
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text(trip.name, centerX, 60, { align: 'center' });
        
        // Date range
        const startDate = new Date(trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        const endDate = new Date(trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${startDate} to ${endDate}`, centerX, 80, { align: 'center' });
        
        // Summary stats
        pdf.setFontSize(12);
        const totalArrivals = trip.arrivals.length;
        const totalActivities = trip.activities.length;
        const totalDepartures = trip.departures.length;
        
        pdf.text(`${totalArrivals} Arrivals • ${totalActivities} Activities • ${totalDepartures} Departures`, 
                 centerX, 100, { align: 'center' });
        
        // Add decorative line
        pdf.setLineWidth(0.5);
        pdf.line(margin, 120, pageWidth - margin, 120);
        
        // Generated timestamp
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric', 
            hour: 'numeric', minute: '2-digit' 
        })}`, centerX, pageHeight - 20, { align: 'center' });
        
        pdf.addPage();
    }

    // Generate date range for trip
    generateDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        
        let currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    // Create day card data structure
    createDayCardData(date, trip) {
        const dateStr = date.getFullYear() + '-' + 
            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0');
        
        const dayCard = {
            date: date,
            dateStr: dateStr,
            title: date.toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric' 
            }),
            events: []
        };
        
        // Add arrivals
        trip.arrivals
            .filter(a => a.date === dateStr)
            .forEach(arrival => {
                dayCard.events.push({
                    type: 'arrival',
                    time: arrival.time,
                    description: `${arrival.name} arrives`,
                    icon: '🛬'
                });
            });
        
        // Add activities
        trip.activities
            .filter(a => a.date === dateStr)
            .forEach(activity => {
                const timeStr = activity.endTime ? 
                    `${activity.startTime} - ${activity.endTime}` : 
                    activity.startTime;
                dayCard.events.push({
                    type: 'activity',
                    time: timeStr,
                    description: activity.name,
                    icon: '📅'
                });
            });
        
        // Add departures
        trip.departures
            .filter(d => d.date === dateStr)
            .forEach(departure => {
                dayCard.events.push({
                    type: 'departure',
                    time: departure.time,
                    description: `${departure.name} departs`,
                    icon: '🛫'
                });
            });
        
        return dayCard;
    }

    // Add day card to PDF
    async addDayCardToPDF(pdf, dayCard, x, y, width) {
        const cardHeight = 20 + (dayCard.events.length * 12) + (dayCard.events.length === 0 ? 10 : 0);
        
        // Card background with rounded corners effect
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(227, 230, 234);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(x, y, width, cardHeight, 2, 2, 'FD');
        
        // Add subtle shadow effect
        pdf.setFillColor(0, 0, 0, 0.05);
        pdf.roundedRect(x + 1, y + 1, width, cardHeight, 2, 2, 'F');
        
        // Card background (on top of shadow)
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, width, cardHeight, 2, 2, 'FD');
        
        // Day title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 26, 26);
        pdf.text(dayCard.title, x + 10, y + 12);
        
        // Events
        let eventY = y + 25;
        
        if (dayCard.events.length === 0) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(136, 136, 136);
            pdf.text('No events', x + 10, eventY);
        } else {
            dayCard.events.forEach(event => {
                // Event background color based on type
                let bgColor, borderColor;
                switch (event.type) {
                    case 'arrival':
                        bgColor = [212, 237, 218]; // Light green
                        borderColor = [40, 167, 69]; // Green
                        break;
                    case 'activity':
                        bgColor = [204, 229, 255]; // Light blue
                        borderColor = [0, 123, 255]; // Blue
                        break;
                    case 'departure':
                        bgColor = [248, 215, 218]; // Light red
                        borderColor = [220, 53, 69]; // Red
                        break;
                }
                
                // Event background
                pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                pdf.setLineWidth(1);
                pdf.roundedRect(x + 10, eventY - 7, width - 20, 10, 1, 1, 'FD');
                
                // Left border for event type
                pdf.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
                pdf.rect(x + 10, eventY - 7, 2, 10, 'F');
                
                // Event text
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(26, 26, 26);
                
                // Icon and time
                const eventText = `${event.icon} ${event.time} - ${event.description}`;
                pdf.text(eventText, x + 16, eventY - 1);
                
                eventY += 12;
            });
        }
        
        return y + cardHeight;
    }

    // Show/hide loading state
    showLoadingState(show) {
        let loadingOverlay = document.getElementById('pdfLoadingOverlay');
        
        if (show && !loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'pdfLoadingOverlay';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            loadingOverlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <div style="font-size: 18px; color: #333;">Generating PDF...</div>
                    <div style="font-size: 14px; color: #666; margin-top: 10px;">Please wait while we create your trip itinerary</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingOverlay);
        } else if (!show && loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Global function to export current trip
async function exportCurrentTripToPDF() {
    if (!currentTrip) {
        alert('No trip selected for export');
        return;
    }
    
    const exporter = new TripPDFExporter();
    await exporter.exportTripToPDF(currentTrip);
}

// Initialize exporter when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.tripPDFExporter = new TripPDFExporter();
});
