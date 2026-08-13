package redis

import (
	"context"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// Config holds Redis configuration.
type Config struct {
	Host     string        `mapstructure:"host"`
	Port     int           `mapstructure:"port"`
	Password string        `mapstructure:"password"`
	DB       int           `mapstructure:"db"`
	PoolSize int           `mapstructure:"pool_size"`
	Timeout  time.Duration `mapstructure:"timeout"`
}

// Client wraps go-redis client.
type Client struct {
	*goredis.Client
}

// New creates a new Redis client.
func New(cfg Config) (*Client, error) {
	client := goredis.NewClient(&goredis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		DialTimeout:  cfg.Timeout,
		ReadTimeout:  cfg.Timeout,
		WriteTimeout: cfg.Timeout,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return &Client{client}, nil
}

// DistributedLock implements distributed locking via Redis.
type DistributedLock struct {
	client *Client
}

// NewDistributedLock creates a new distributed lock manager.
func NewDistributedLock(client *Client) *DistributedLock {
	return &DistributedLock{client: client}
}

// Acquire tries to acquire a lock with TTL.
func (l *DistributedLock) Acquire(ctx context.Context, key, holder string, ttl time.Duration) (bool, error) {
	result, err := l.client.SetNX(ctx, "lock:"+key, holder, ttl).Result()
	return result, err
}

// Release releases a lock.
func (l *DistributedLock) Release(ctx context.Context, key, holder string) error {
	script := `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`
	_, err := l.client.Eval(ctx, script, []string{"lock:" + key}, holder).Result()
	return err
}

// RateLimiter implements rate limiting via Redis.
type RateLimiter struct {
	client *Client
}

// NewRateLimiter creates a new rate limiter.
func NewRateLimiter(client *Client) *RateLimiter {
	return &RateLimiter{client: client}
}

// Allow checks if a request is allowed under the rate limit.
func (r *RateLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	pipe := r.client.Pipeline()
	incr := pipe.Incr(ctx, "ratelimit:"+key)
	pipe.Expire(ctx, "ratelimit:"+key, window)
	_, err := pipe.Exec(ctx)
	if err != nil {
		return false, err
	}
	return incr.Val() <= int64(limit), nil
}
