const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  connectionLimit: 5,
  acquireTimeout: 30000,
  timeout: 30000,
  reconnect: true,
  waitForConnections: true,
  queueLimit: 0
};

class DatabaseMonitor {
  constructor() {
    this.connection = null;
    this.isMonitoring = false;
    this.stats = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageResponseTime: 0,
      lastError: null,
      lastSuccess: null
    };
  }

  async connect() {
    try {
      console.log('🔌 Attempting to connect to database...');
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ Database connection established successfully');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      });
      return false;
    }
  }

  async testQuery() {
    if (!this.connection) {
      console.log('❌ No database connection available');
      return false;
    }

    try {
      const startTime = Date.now();
      const [result] = await this.connection.execute('SELECT 1 as test, NOW() as timestamp');
      const responseTime = Date.now() - startTime;
      
      this.stats.successfulConnections++;
      this.stats.lastSuccess = new Date().toISOString();
      this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
      
      console.log(`✅ Query successful (${responseTime}ms):`, result[0]);
      return true;
    } catch (error) {
      this.stats.failedConnections++;
      this.stats.lastError = {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ Query failed:', {
        message: error.message,
        code: error.code,
        errno: error.errno
      });
      return false;
    }
  }

  async getServerStatus() {
    if (!this.connection) {
      return null;
    }

    try {
      const [variables] = await this.connection.execute(`
        SHOW VARIABLES LIKE '%timeout%'
      `);
      
      const [status] = await this.connection.execute(`
        SHOW STATUS LIKE '%connections%'
      `);
      
      const [processes] = await this.connection.execute(`
        SHOW PROCESSLIST
      `);
      
      return {
        variables,
        status,
        processes: processes.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get server status:', error.message);
      return null;
    }
  }

  async monitor(intervalMs = 5000, durationMs = 60000) {
    console.log(`🔍 Starting database monitoring for ${durationMs/1000} seconds...`);
    console.log(`📊 Monitoring interval: ${intervalMs}ms`);
    
    this.isMonitoring = true;
    const startTime = Date.now();
    
    const monitorInterval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }
      
      this.stats.totalConnections++;
      
      // Test connection
      const isConnected = await this.testQuery();
      
      // Get server status every 10th check
      if (this.stats.totalConnections % 10 === 0) {
        const serverStatus = await this.getServerStatus();
        if (serverStatus) {
          console.log('📊 Server Status:', {
            connections: serverStatus.status.find(s => s.Variable_name === 'Threads_connected')?.Value,
            maxConnections: serverStatus.status.find(s => s.Variable_name === 'Max_used_connections')?.Value,
            activeProcesses: serverStatus.processes,
            waitTimeout: serverStatus.variables.find(v => v.Variable_name === 'wait_timeout')?.Value
          });
        }
      }
      
      // Print stats every 20th check
      if (this.stats.totalConnections % 20 === 0) {
        console.log('📈 Monitoring Stats:', {
          totalChecks: this.stats.totalConnections,
          successRate: `${((this.stats.successfulConnections / this.stats.totalConnections) * 100).toFixed(1)}%`,
          avgResponseTime: `${this.stats.averageResponseTime.toFixed(0)}ms`,
          lastError: this.stats.lastError?.message || 'None'
        });
      }
      
      // Check if monitoring duration has elapsed
      if (Date.now() - startTime >= durationMs) {
        this.stopMonitoring();
        clearInterval(monitorInterval);
        await this.printFinalReport();
      }
    }, intervalMs);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('🛑 Database monitoring stopped');
  }

  async printFinalReport() {
    console.log('\n📊 FINAL MONITORING REPORT');
    console.log('========================');
    console.log(`Total Connection Attempts: ${this.stats.totalConnections}`);
    console.log(`Successful Connections: ${this.stats.successfulConnections}`);
    console.log(`Failed Connections: ${this.stats.failedConnections}`);
    console.log(`Success Rate: ${((this.stats.successfulConnections / this.stats.totalConnections) * 100).toFixed(1)}%`);
    console.log(`Average Response Time: ${this.stats.averageResponseTime.toFixed(0)}ms`);
    
    if (this.stats.lastError) {
      console.log(`Last Error: ${this.stats.lastError.message} (${this.stats.lastError.code})`);
    }
    
    if (this.stats.lastSuccess) {
      console.log(`Last Success: ${this.stats.lastSuccess}`);
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.stats.failedConnections > 0) {
      console.log('⚠️  Connection failures detected. Consider:');
      console.log('   - Checking MySQL server status');
      console.log('   - Verifying network connectivity');
      console.log('   - Reviewing MySQL configuration');
      console.log('   - Checking firewall settings');
    } else {
      console.log('✅ No connection issues detected');
    }
    
    if (this.stats.averageResponseTime > 1000) {
      console.log('⚠️  Slow response times detected. Consider:');
      console.log('   - Optimizing database queries');
      console.log('   - Adding database indexes');
      console.log('   - Upgrading server resources');
    }
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.end();
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.error('❌ Error closing connection:', error.message);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new DatabaseMonitor();
  
  try {
    // Parse command line arguments
    const intervalMs = parseInt(args[0]) || 5000;
    const durationMs = parseInt(args[1]) || 60000;
    
    console.log('🚀 Database Connection Monitor');
    console.log('=============================');
    console.log(`Interval: ${intervalMs}ms`);
    console.log(`Duration: ${durationMs/1000}s`);
    console.log('');
    
    // Test initial connection
    const connected = await monitor.connect();
    if (!connected) {
      console.log('❌ Cannot start monitoring - no database connection');
      process.exit(1);
    }
    
    // Start monitoring
    await monitor.monitor(intervalMs, durationMs);
    
  } catch (error) {
    console.error('❌ Monitor error:', error.message);
  } finally {
    await monitor.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});

// Run the monitor
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseMonitor; 