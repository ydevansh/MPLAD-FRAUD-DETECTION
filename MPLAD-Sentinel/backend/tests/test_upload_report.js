import sharp from 'sharp';

async function testSubmitReport() {
  try {
    const imgBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 50, g: 150, b: 200 }
      }
    }).png().toBuffer();

    const formData = new FormData();
    const blob = new Blob([imgBuffer], { type: 'image/png' });
    formData.append('image', blob, 'sample_test_site.png');
    formData.append('category', 'Project Progress');
    formData.append('description', 'Automated integration test upload: Culvert foundation reinforcement in progress.');
    formData.append('latitude', '26.9858');
    formData.append('longitude', '80.9326');
    formData.append('gpsAccuracy', '12');

    const res = await fetch('http://localhost:5000/api/projects/MPLAD-UP-001/reports', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (data.success && data.data && data.data.reportId) {
      console.log('SUCCESS: Report created with reportId:', data.data.reportId);
    } else {
      console.error('FAILED: Unexpected response format');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testSubmitReport();
