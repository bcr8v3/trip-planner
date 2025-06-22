// PDF Export functionality for Travel Planner
// This creates beautiful PDF exports using html2pdf.js for better reliability

class TripPDFExporter {
    constructor() {
        console.log('TripPDFExporter initialized with html2pdf.js');
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

            // Load html2pdf if needed
            await this.ensureHtml2PdfLoaded();

            console.log('html2pdf available, generating PDF...');
            
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

    async ensureHtml2PdfLoaded() {
        // Check if already loaded
        if (window.html2pdf) {
            console.log('html2pdf already available');
            return;
        }

        console.log('html2pdf not found, loading...');
        
        // Try to load from multiple sources
        const cdnSources = [
            'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
            'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
            'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
        ];

        for (let i = 0; i < cdnSources.length; i++) {
            try {
                console.log(`Trying CDN ${i + 1}:`, cdnSources[i]);
                await this.loadScriptFromCDN(cdnSources[i]);
                
                // Wait a bit for the library to initialize
                await new Promise(resolve => setTimeout(resolve, 300));
                
                if (window.html2pdf) {
                    console.log(`Successfully loaded html2pdf from CDN ${i + 1}`);
                    return;
                }
            } catch (error) {
                console.log(`CDN ${i + 1} failed:`, error.message);
            }
        }

        // If all CDNs failed, throw error
        throw new Error('Failed to load html2pdf library from all CDN sources. Please check your internet connection and try again.');
    }

    // Load script from a specific CDN
    async loadScriptFromCDN(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            
            const timeout = setTimeout(() => {
                reject(new Error('Script loading timeout'));
            }, 10000); // 10 second timeout
            
            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Failed to load script from ${url}`));
            };
            
            document.head.appendChild(script);        });
    }

    // Generate the actual PDF document using html2pdf.js
    async generatePDF(trip) {
        console.log('Creating PDF document with html2pdf.js...');
        
        // Create HTML content for the PDF
        const htmlContent = this.createTripHTML(trip);
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);
        
        try {
            // Configure html2pdf options
            const options = {
                margin: 10,
                filename: `${trip.name.replace(/[^a-zA-Z0-9\s]/g, '')}_Itinerary.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            console.log('Generating PDF with html2pdf...');
            await window.html2pdf().set(options).from(tempContainer).save();
            console.log('PDF generated successfully!');
            
        } finally {
            // Clean up the temporary container
            document.body.removeChild(tempContainer);
        }
    }    // Create HTML content that matches the website's styling
    createTripHTML(trip) {
        console.log('Creating HTML content for trip:', trip.name);
        
        const dates = this.generateDateRange(trip.startDate, trip.endDate);
        let dayCardsHTML = '';
        
        // Generate HTML for each day card
        dates.forEach(date => {
            const dayCard = this.createDayCardData(date, trip);
            dayCardsHTML += this.createDayCardHTML(dayCard);
        });
        
        const startDate = new Date(trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        const endDate = new Date(trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
        });
        
        const totalArrivals = trip.arrivals ? trip.arrivals.length : 0;
        const totalActivities = trip.activities ? trip.activities.length : 0;
        const totalDepartures = trip.departures ? trip.departures.length : 0;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${trip.name} - Travel Itinerary</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #fff;
                        color: #333;
                        line-height: 1.4;
                    }
                    .title-page {
                        text-align: center;
                        padding: 60px 20px;
                        border-bottom: 2px solid #007bff;
                        margin-bottom: 40px;
                    }
                    .trip-title {
                        font-size: 36px;
                        font-weight: bold;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                    }
                    .trip-dates {
                        font-size: 20px;
                        color: #666;
                        margin-bottom: 30px;
                    }
                    .trip-stats {
                        display: flex;
                        justify-content: center;
                        gap: 40px;
                        font-size: 16px;
                        color: #333;
                        margin-bottom: 30px;
                    }
                    .stat-item {
                        text-align: center;
                    }
                    .day-card {
                        background: #fff;
                        border: 1px solid #e3e6ea;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        padding: 15px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        page-break-inside: avoid;
                    }
                    .day-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #1a1a1a;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 8px;
                    }
                    .event-item {
                        margin: 8px 0;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 14px;
                        position: relative;
                        padding-left: 20px;
                    }
                    .event-arrival {
                        background: #d4edda;
                        border-left: 4px solid #28a745;
                    }
                    .event-activity {
                        background: #cce7ff;
                        border-left: 4px solid #007bff;
                    }
                    .event-departure {
                        background: #f8d7da;
                        border-left: 4px solid #dc3545;
                    }
                    .no-events {
                        color: #888;
                        font-style: italic;
                        padding: 10px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #999;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="title-page">
                    <div class="trip-title">${trip.name}</div>
                    <div class="trip-dates">${startDate} to ${endDate}</div>
                    <div class="trip-stats">
                        <div class="stat-item">${totalArrivals} Arrivals</div>
                        <div class="stat-item">${totalActivities} Activities</div>
                        <div class="stat-item">${totalDepartures} Departures</div>
                    </div>
                </div>
                
                <div class="day-cards">
                    ${dayCardsHTML}
                </div>
                
                <div class="footer">
                    Generated on ${new Date().toLocaleDateString('en-US', { 
                        month: 'long', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                    })}
                </div>
            </body>
            </html>
        `;
    }

    // Create HTML for a single day card
    createDayCardHTML(dayCard) {
        let eventsHTML = '';
        
        if (dayCard.events.length === 0) {
            eventsHTML = '<div class="no-events">No events scheduled</div>';
        } else {
            dayCard.events.forEach(event => {
                const eventClass = `event-${event.type}`;
                eventsHTML += `
                    <div class="event-item ${eventClass}">
                        ${event.icon} ${event.time} - ${event.description}
                    </div>
                `;
            });
        }
        
        return `
            <div class="day-card">
                <div class="day-title">${dayCard.title}</div>
                ${eventsHTML}
            </div>
        `;
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
