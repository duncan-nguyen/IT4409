# CNWeb COTURN Server

STUN/TURN server for NAT traversal in WebRTC connections.

## What is STUN/TURN?

### STUN (Session Traversal Utilities for NAT)
- Helps clients discover their public IP address
- Enables direct peer-to-peer connections through NAT
- Free to use, minimal server resources

### TURN (Traversal Using Relays around NAT)
- Acts as a relay server when direct P2P connection fails
- Routes all media traffic through the server
- More resource-intensive

## Configuration

The COTURN server is configured via `turnserver.conf`:

- **STUN Port**: 3478 (UDP/TCP)
- **TURNS Port**: 5349 (TLS)
- **Media Relay Ports**: 49152-65535 (UDP)
- **Realm**: cnweb.local
- **Default User**: cnwebuser:cnwebpass

## Usage in Frontend

```javascript
const iceServers = [
  {
    urls: 'stun:localhost:3478'
  },
  {
    urls: 'turn:localhost:3478',
    username: 'cnwebuser',
    credential: 'cnwebpass'
  }
];

const peerConnection = new RTCPeerConnection({
  iceServers: iceServers
});
```

## Testing STUN/TURN

### Test STUN Server
```bash
# Install stuntman-client (Linux)
sudo apt-get install stuntman-client

# Test STUN
stunclient localhost 3478
```

### Test TURN Server
You can use online tools like:
- https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- Enter your TURN server details and click "Gather candidates"

## Production Deployment

For production, you should:

1. **Use a public IP address**:
   ```conf
   external-ip=YOUR_PUBLIC_IP
   ```

2. **Enable TLS (TURNS)**:
   ```conf
   cert=/path/to/certificate.pem
   pkey=/path/to/private-key.pem
   ```

3. **Use strong passwords**:
   ```conf
   user=production_user:strong_random_password
   ```

4. **Configure firewall**:
   - Open port 3478 (UDP/TCP) for STUN
   - Open port 5349 (UDP/TCP) for TURNS
   - Open ports 49152-65535 (UDP) for media relay

5. **Monitor resource usage**:
   TURN servers can be bandwidth-intensive when relaying media.

## Alternative: Public STUN Servers

For development/testing, you can use free public STUN servers:

```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];
```

**Note**: Public STUN servers don't provide TURN functionality.

## Docker Commands

```bash
# View COTURN logs
docker logs cnweb-coturn

# Restart COTURN
docker restart cnweb-coturn

# Check if COTURN is running
docker ps | grep coturn
```

## Troubleshooting

### Connection Issues
1. Check firewall rules
2. Verify ports are not blocked
3. Ensure external-ip is set correctly (for production)

### High CPU/Bandwidth
1. Limit max-bps in config
2. Reduce user-quota
3. Consider scaling TURN servers

### Authentication Failures
1. Verify username:password format
2. Check realm configuration
3. Ensure lt-cred-mech is enabled
