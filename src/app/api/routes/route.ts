import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RouteEvent, RouteHistory } from '@/lib/types';

function generateRoutePoints(startLat: number, startLng: number, numPoints: number) {
  const points = [{ lat: startLat, lng: startLng }];
  let currentLat = startLat;
  let currentLng = startLng;

  for (let i = 1; i < numPoints; i++) {
    // Simulate slight, random turns and movements typical for city driving
    const latChange = (Math.random() - 0.5) * 0.005; // smaller changes for more realistic streets
    const lngChange = (Math.random() - 0.5) * 0.005;
    currentLat += latChange;
    currentLng += lngChange;

    // Add some "straight" sections
    if (i % 3 === 0) {
        currentLat += (Math.random() - 0.5) * 0.001; // smaller deviation
    } else {
        currentLng += (Math.random() - 0.5) * 0.001;
    }
    
    points.push({ lat: currentLat, lng: currentLng });
  }

  return points;
}

function generateRouteEvents(): RouteEvent[] {
  const events: RouteEvent[] = [];
  const now = new Date();
  let currentTime = new Date(now.getTime() - (Math.random() * 60 + 60) * 60 * 1000); // Start 1-2 hours ago

  // Start Event
  events.push({
    timestamp: currentTime.toISOString(),
    status: 'start',
    distanceKm: 0,
    durationMinutes: 0,
    description: 'Trip started from depot.'
  });

  const numSegments = Math.floor(Math.random() * 3) + 2; // 2 to 4 segments
  const descriptions = ['Driving through city center', 'Navigating residential area', 'On the highway stretch', 'Passing by local park', 'Stuck in light traffic'];
  const stopDescriptions = ['Coffee break', 'Quick delivery stop', 'Waiting for traffic light', 'Checking directions'];

  for (let i = 0; i < numSegments; i++) {
    // Driving segment
    const duration = Math.random() * 20 + 5; // 5-25 minutes
    const distance = (duration / 60) * (Math.random() * 20 + 20); // Avg speed 20-40 km/h
    currentTime = new Date(currentTime.getTime() + duration * 60 * 1000);
    events.push({
      timestamp: currentTime.toISOString(),
      status: 'driving',
      distanceKm: parseFloat(distance.toFixed(1)),
      durationMinutes: parseFloat(duration.toFixed(0)),
      description: descriptions[Math.floor(Math.random() * descriptions.length)]
    });

    // Optional stop
    if (i < numSegments - 1 && Math.random() > 0.5) {
      const stopDuration = Math.random() * 10 + 2; // 2-12 minutes
      currentTime = new Date(currentTime.getTime() + stopDuration * 60 * 1000);
      events.push({
        timestamp: currentTime.toISOString(),
        status: 'stop',
        distanceKm: 0,
        durationMinutes: parseFloat(stopDuration.toFixed(0)),
        description: stopDescriptions[Math.floor(Math.random() * stopDescriptions.length)]
      });
    }
  }

  // End Event
  currentTime = new Date(currentTime.getTime() + 1 * 60 * 1000); // 1 minute to "finish"
  events.push({
    timestamp: currentTime.toISOString(),
    status: 'end',
    distanceKm: 0,
    durationMinutes: 0,
    description: 'Arrived at destination.'
  });

  return events;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startLat, startLng } = body;

    if (typeof startLat !== 'number' || typeof startLng !== 'number') {
      return NextResponse.json({ error: 'Invalid start coordinates' }, { status: 400 });
    }

    const routeEvents = generateRouteEvents();
    const totalDurationMinutes = routeEvents.reduce((sum, e) => sum + e.durationMinutes, 0);
    
    // The number of points should be related to the duration of the trip
    // Let's say 1 point per 2 minutes of driving.
    const numPoints = Math.max(10, Math.floor(totalDurationMinutes / 2));

    const routePoints = generateRoutePoints(startLat, startLng, numPoints);

    const routeHistory: RouteHistory = {
      routePoints,
      routeEvents,
    };

    return NextResponse.json(routeHistory);
  } catch (error) {
    console.error("Error generating route:", error);
    return NextResponse.json({ error: 'Failed to generate route' }, { status: 500 });
  }
}
