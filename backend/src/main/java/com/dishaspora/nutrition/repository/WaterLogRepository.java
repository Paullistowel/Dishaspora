package com.dishaspora.nutrition.repository;

import com.dishaspora.nutrition.entity.WaterLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WaterLogRepository extends JpaRepository<WaterLog, Long> {

    Optional<WaterLog> findByUserIdAndDate(Long userId, LocalDate date);

    List<WaterLog> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
}
