package com.dishaspora.nutrition.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

/** One water-intake total per user per day (millilitres). */
@Entity
@Table(name = "water_logs",
        uniqueConstraints = @UniqueConstraint(name = "uq_water_user_date", columnNames = {"userId", "date"}))
public class WaterLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    private int milliliters;

    public WaterLog() {}

    public WaterLog(Long userId, LocalDate date, int milliliters) {
        this.userId = userId;
        this.date = date;
        this.milliliters = milliliters;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public int getMilliliters() { return milliliters; }
    public void setMilliliters(int milliliters) { this.milliliters = milliliters; }
}
