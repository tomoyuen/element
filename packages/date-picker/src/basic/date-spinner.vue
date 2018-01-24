<template>
  <div class="el-time-spinner has-seconds">
    <el-scrollbar
      @mouseenter.native="emitSelectRange('years')"
      class="el-time-spinner__wrapper"
      wrap-style="max-height: inherit;"
      view-class="el-time-spinner__list"
      noresize
      tag="ul"
      ref="year">
      <li
        v-for="year in yearsList"
        @click="handleClick('years', { value: year }, true)"
        track-by="year"
        class="el-time-spinner__item"
        :class="{ 'active': year === years }"
        v-text="year"></li>
    </el-scrollbar>
    <el-scrollbar
      @mouseenter.native="emitSelectRange('months')"
      class="el-time-spinner__wrapper"
      wrap-style="max-height: inherit;"
      view-class="el-time-spinner__list"
      noresize
      tag="ul"
      ref="month">
      <li
        v-for="(month, key) in 12"
        @click="handleClick('months', { value: key }, true)"
        class="el-time-spinner__item"
        :class="{ 'active': key === months }"
        v-text="key + 1"></li>
    </el-scrollbar>
    <el-scrollbar
      @mouseenter.native="emitSelectRange('dates')"
      class="el-time-spinner__wrapper"
      wrap-style="max-height: inherit;"
      view-class="el-time-spinner__list"
      noresize
      tag="ul"
      ref="date">
      <li
        v-for="date in datesList"
        @click="handleClick('dates', { value: date }, true)"
        class="el-time-spinner__item"
        :class="{ 'active': date === dates }"
        v-text="date"></li>
    </el-scrollbar>
  </div>
</template>

<script type="text/babel">
  import { range } from 'lodash';
  import ElScrollbar from 'element-ui/packages/scrollbar';
  import debounce from 'throttle-debounce/debounce';

  const currentDate = new Date();

  export default {
    components: { ElScrollbar },

    props: {
      years: {
        type: Number,
        default: currentDate.getFullYear()
      },

      months: {
        type: Number,
        default: currentDate.getMonth()
      },

      dates: {
        type: Number,
        default: currentDate.getDate()
      }
    },

    watch: {
      yearsPrivate(newVal, oldVal) {
        if (!(newVal >= currentDate.getFullYear() - 150 && newVal <= currentDate.getFullYear())) {
          this.yearsPrivate = oldVal;
        }
        this.ajustElTop('year', newVal);
        this.$emit('change', new Date(newVal, this.months, this.adjustDates(newVal, this.months)));
      },

      monthsPrivate(newVal, oldVal) {
        if (!(newVal >= 0 && newVal < 12)) {
          this.monthsPrivate = oldVal;
        }
        this.ajustElTop('month', newVal);
        this.$emit('change', new Date(this.yearsPrivate, newVal, this.adjustDates(this.years, newVal)));
      },

      datesPrivate(newVal, oldVal) {
        if (!(newVal > 0 && newVal <= 59)) {
          this.datesPrivate = oldVal;
        }
        this.ajustElTop('date', newVal);
        this.$emit('change', new Date(this.yearsPrivate, this.monthsPrivate, newVal));
      }
    },

    computed: {
      yearsList() {
        return range(currentDate.getFullYear() - 150, currentDate.getFullYear() + 1);
      },

      yearEl() {
        return this.$refs.year.wrap;
      },

      monthEl() {
        return this.$refs.month.wrap;
      },

      dateEl() {
        return this.$refs.date.wrap;
      },

      datesList() {
        const totalDays = this.getDaysByMonthAndYear(this.years, this.months);
        if (this.dates > totalDays) {
          this.ajustElTop('date', totalDays);
        }
        return range(1, totalDays + 1);
      }
    },

    data() {
      return {
        yearsPrivate: currentDate.getFullYear(),
        monthsPrivate: currentDate.getMonth(),
        datesPrivate: currentDate.getDate(),
        selectableRange: range(currentDate.getFullYear() - 150, currentDate.getFullYear())
      };
    },

    created() {
      this.debounceAjustElTop = debounce(100, type => this.ajustElTop(type, this[`${type}s`]));
    },

    mounted() {
      this.$nextTick(() => {
        this.bindScrollEvent();
      });
    },

    methods: {
      getDaysByMonthAndYear(year, month) {
        return new Date(new Date(year, month + 1, 1) - 1).getDate();
      },
      adjustDates(year, month) {
        const totalDates = this.getDaysByMonthAndYear(year, month);
        const date = this.dates > totalDates ? totalDates : this.dates;
        if (date !== this.dates) {
          this.ajustElTop('date', date);
        }
        return date;
      },
      handleClick(type, value, disabled) {
        if (value.disabled) {
          return;
        }

        const threshold = type === 'months' ? -1 : 0;

        this[type + 'Private'] = value.value > threshold ? value.value : value;

        this.emitSelectRange(type);
      },

      emitSelectRange(type) {
        if (type === 'years') {
          this.$emit('select-range', 0, 4);
        } else if (type === 'months') {
          this.$emit('select-range', 5, 7);
        } else if (type === 'dates') {
          this.$emit('select-range', 8, 10);
        }
      },

      bindScrollEvent() {
        const bindFuntion = (type) => {
          this[`${type}El`].onscroll = (e) => this.handleScroll(type, e);
        };
        bindFuntion('year');
        bindFuntion('month');
        bindFuntion('date');
      },

      handleScroll(type) {
        const year = Math.min(Math.floor((this.yearEl.scrollTop - 80) / 32 + 3 + this.yearsList[0]), currentDate.getFullYear());
        const month = Math.min(Math.floor((this.monthEl.scrollTop - 80) / 32 + 3), 12);
        let date = Math.min(Math.floor((this.dateEl.scrollTop - 80) / 32 + 3 + this.datesList[0]), this.datesList[this.datesList.length - 1]);
        if (type !== 'date') {
          date = this.adjustDates(year, month);
        }
        this.debounceAjustElTop(type);
        this.$emit('change', new Date(year, month, date));
      },

      ajustScrollTop() {
        this.ajustElTop('year', this.years);
        this.ajustElTop('month', this.months);
        this.ajustElTop('date', this.dates);
      },

      ajustElTop(type, value) {
        this[`${type}El`].scrollTop = Math.max(0, ((this[`${type}sList`] ? value - this[`${type}sList`][0] : value) - 2.5) * 32 + 80);
      }
    }
  };
</script>
