// PDF Export functionality for Travel Planner
// This creates beautiful PDF exports that match the website's day card styling

class TripPDFExporter {
    constructor() {
        console.log('TripPDFExporter initialized');
    }

    // Main export function
    async exportTripToPDF(trip) {
        if (!trip) {
            alert('No trip data available for export');
            return;
        }

        try {
            console.log('Starting PDF export for trip:', trip.name);
            
            // Show loading state
            this.showLoadingState(true);

            // Check if jsPDF is available
            if (!window.jsPDF) {
                console.log('jsPDF not found, attempting to load...');
                await this.loadJsPDF();
            }

            // Verify jsPDF loaded
            if (!window.jsPDF) {
                throw new Error('jsPDF library failed to load. Please refresh the page and try again.');
            }

            console.log('jsPDF available, generating PDF...');
            
            // Create the PDF
            await this.generatePDF(trip);
            
            console.log('PDF generated successfully!');

        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Error generating PDF: ' + error.message + '\n\nPlease refresh the page and try again.');
        } finally {
            this.showLoadingState(false);
        }
    }

    // Load jsPDF library dynamically
    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            console.log('Loading jsPDF library...');
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            
            script.onload = () => {
                console.log('jsPDF loaded successfully from CDN');
                resolve();
            };
            
            script.onerror = () => {
                console.log('Primary CDN failed, trying fallback...');
                
                // Try fallback CDN
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
                
                fallbackScript.onload = () => {
                    console.log('jsPDF loaded from fallback CDN');
                    resolve();
                };
                
                fallbackScript.onerror = () => {
                    console.error('Both CDNs failed to load jsPDF');
                    reject(new Error('Failed to load jsPDF from all CDN sources'));
                };
                
                document.head.appendChild(fallbackScript);
            };
            
            document.head.appendChild(script);
        });
    }

    // Generate the actual PDF document
    async generatePDF(trip) {
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        console.log('Creating PDF document...');
        
        // Page dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Add title page
        this.addTitlePage(pdf, trip, pageWidth, pageHeight, margin);
        
        // Generate dates for the trip
        const dates = this.generateDateRange(trip.startDate, trip.endDate);
        console.log(`Generating ${dates.length} day cards...`);
        
        // Create day cards data
        const dayCards = dates.map(date => this.createDayCardData(date, trip));
        
        // Add day cards to PDF (starting on page 2)
        pdf.addPage();
        let currentY = margin;
        let cardsOnPage = 0;
        const maxCardsPerPage = 3;
        
        for (let i = 0; i < dayCards.length; i++) {
            const dayCard = dayCards[i];
            
            // Check if we need a new page
            if (cardsOnPage >= maxCardsPerPage) {
                pdf.addPage();
                currentY = margin;
                cardsOnPage = 0;
            }
            
            // Add day card to current page
            currentY = this.addDayCardToPDF(pdf, dayCard, margin, currentY, contentWidth);
            currentY += 15; // Space between cards
            cardsOnPage++;
        }
        
        // Save the PDF
        const fileName = `${trip.name.replace(/[^a-zA-Z0-9\s]/g, '')}_Itinerary.pdf`;
        console.log('Saving PDF as:', fileName);
        pdf.save(fileName);
    }

    // Add beautiful title page
    addTitlePage(pdf, trip, pageWidth, pageHeight, margin) {
        const centerX = pageWidth / 2;
        
        // Main title
        pdf.setFontSize(32);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 26, 26);
        pdf.text(trip.name, centerX, 70, { align: 'center' });
        
        // Date range
        const startDate = new Date(trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        const endDate = new Date(trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${startDate} to ${endDate}`, centerX, 90, { align: 'center' });
        
        // Summary statistics
        pdf.setFontSize(14);
        pdf.setTextColor(60, 60, 60);
        const totalArrivals = trip.arrivals ? trip.arrivals.length : 0;
        const totalActivities = trip.activities ? trip.activities.length : 0;
        const totalDepartures = trip.departures ? trip.departures.length : 0;
        
        pdf.text(`${totalArrivals} Arrivals`, centerX - 60, 120, { align: 'center' });
        pdf.text(`${totalActivities} Activities`, centerX, 120, { align: 'center' });
        pdf.text(`${totalDepartures} Departures`, centerX + 60, 120, { align: 'center' });
        
        // Decorative elements
        pdf.setLineWidth(1);
        pdf.setDrawColor(0, 123, 255);
        pdf.line(margin + 40, 140, pageWidth - margin - 40, 140);
        
        // Footer
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        const now = new Date();
        pdf.text(`Generated on ${now.toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        })}`, centerX, pageHeight - 30, { align: 'center' });
    }

    // Generate array of dates for the trip
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

    // Create day card data matching website structure
    createDayCardData(date, trip) {
        const dateStr = date.getFullYear() + '-' + 
            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0');
        
        const dayCard = {
            date: date,
            dateStr: dateStr,
            title: date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            }),
            events: []
        };
        
        // Add arrivals for this date
        if (trip.arrivals) {
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
        }
        
        // Add activities for this date
        if (trip.activities) {
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
        }
        
        // Add departures for this date
        if (trip.departures) {
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
        }
        
        return dayCard;
    }

    // Add a day card to the PDF with exact website styling
    addDayCardToPDF(pdf, dayCard, x, y, width) {
        const cardPadding = 8;
        const eventHeight = 12;
        const minCardHeight = 25;
        const cardHeight = Math.max(minCardHeight, 25 + (dayCard.events.length * eventHeight));
        
        // Card shadow (offset background)
        pdf.setFillColor(0, 0, 0, 20);
        pdf.roundedRect(x + 2, y + 2, width, cardHeight, 3, 3, 'F');
        
        // Main card background
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(227, 230, 234);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(x, y, width, cardHeight, 3, 3, 'FD');
        
        // Day title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 26, 26);
        pdf.text(dayCard.title, x + cardPadding, y + 15);
        
        // Events section
        let eventY = y + 28;
        
        if (dayCard.events.length === 0) {
            // No events message
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(136, 136, 136);
            pdf.text('No events scheduled', x + cardPadding, eventY);
        } else {
            // Render each event
            dayCard.events.forEach(event => {
                // Event background color and border
                let bgColor, borderColor;
                switch (event.type) {
                    case 'arrival':
                        bgColor = [212, 237, 218]; // Light green matching website
                        borderColor = [40, 167, 69]; // Green
                        break;
                    case 'activity':
                        bgColor = [204, 229, 255]; // Light blue matching website
                        borderColor = [0, 123, 255]; // Blue
                        break;
                    case 'departure':
                        bgColor = [248, 215, 218]; // Light red matching website
                        borderColor = [220, 53, 69]; // Red
                        break;
                    default:
                        bgColor = [240, 240, 240];
                        borderColor = [128, 128, 128];
                }
                
                // Event background
                pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                pdf.roundedRect(x + cardPadding, eventY - 8, width - (cardPadding * 2), 11, 2, 2, 'F');
                
                // Left border indicator (matching website's border-left style)
                pdf.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
                pdf.rect(x + cardPadding, eventY - 8, 3, 11, 'F');
                
                // Event text
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(26, 26, 26);
                
                const eventText = `${event.icon} ${event.time} - ${event.description}`;
                pdf.text(eventText, x + cardPadding + 8, eventY - 2);
                
                eventY += eventHeight;
            });
        }        
        return y + cardHeight;
    }

    // Show/hide loading overlay
    showLoadingState(show) {
        let loadingOverlay = document.getElementById('pdfLoadingOverlay');
        
        if (show && !loadingOverlay) {
            // Create loading overlay
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'pdfLoadingOverlay';
            loadingOverlay.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                ">
                    <div style="text-align: center; padding: 40px;">
                        <div style="
                            width: 50px;
                            height: 50px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #007bff;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px;
                        "></div>
                        <div style="font-size: 20px; color: #333; margin-bottom: 10px;">
                            Generating PDF...
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            Creating your beautiful trip itinerary
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        } else if (!show && loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Global function to export current trip (called by the Export button)
async function exportCurrentTripToPDF() {
    console.log('Export button clicked');
    
    // Try multiple ways to access the current trip
    let trip = null;
    
    // Check if currentTrip exists in global scope
    if (typeof currentTrip !== 'undefined' && currentTrip) {
        trip = currentTrip;
        console.log('Found currentTrip in global scope:', trip.name);
    }
    // Fallback to window.currentTrip
    else if (window.currentTrip) {
        trip = window.currentTrip;
        console.log('Found currentTrip on window object:', trip.name);
    }
    
    if (!trip) {
        console.error('No trip found. currentTrip:', typeof currentTrip !== 'undefined' ? currentTrip : 'undefined');
        console.error('window.currentTrip:', window.currentTrip);
        alert('No trip selected for export. Please select a trip first.');
        return;
    }
    
    console.log('Exporting trip:', trip.name);
    const exporter = new TripPDFExporter();
    await exporter.exportTripToPDF(trip);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF Exporter ready');
    window.tripPDFExporter = new TripPDFExporter();
});
