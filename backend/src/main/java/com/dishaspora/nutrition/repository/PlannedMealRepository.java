package com.dishaspora.nutrition.repository;

import com.dishaspora.nutrition.entity.PlannedMeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PlannedMealRepository extends JpaRepository<PlannedMeal, Long> {

    List<PlannedMeal> findByUserIdAndDateOrderBySlotAscIdAsc(Long userId, LocalDate date);

    List<PlannedMeal> findByUserIdAndDateBetweenOrderByDateAscSlotAscIdAsc(
            Long userId, LocalDate from, LocalDate to);
}
