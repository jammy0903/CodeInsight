/**
 * Timer Component Test
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Timer } from '../Timer';

describe('Timer component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render initial time', () => {
    render(<Timer duration={10} onTimeout={() => {}} isPaused={false} />);
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('should countdown every second', () => {
    render(<Timer duration={10} onTimeout={() => {}} isPaused={false} />);
    expect(screen.getByText('10s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('9s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('7s')).toBeInTheDocument();
  });

  it('should call onTimeout when timer reaches zero', () => {
    const handleTimeout = vi.fn();
    render(<Timer duration={5} onTimeout={handleTimeout} isPaused={false} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(handleTimeout).toHaveBeenCalledTimes(1);
  });

  it('should not countdown when paused', () => {
    render(<Timer duration={10} onTimeout={() => {}} isPaused={true} />);
    expect(screen.getByText('10s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('should pause and resume countdown', () => {
    const { rerender } = render(<Timer duration={10} onTimeout={() => {}} isPaused={false} />);
    expect(screen.getByText('10s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000); // 8s left
    });
    expect(screen.getByText('8s')).toBeInTheDocument();

    // Pause the timer
    rerender(<Timer duration={10} onTimeout={() => {}} isPaused={true} />);

    act(() => {
      vi.advanceTimersByTime(3000); // Should not advance
    });
    expect(screen.getByText('8s')).toBeInTheDocument();

    // Resume the timer
    rerender(<Timer duration={10} onTimeout={() => {}} isPaused={false} />);
    
    act(() => {
      vi.advanceTimersByTime(1000); // 7s left
    });
    expect(screen.getByText('7s')).toBeInTheDocument();
  });
});
