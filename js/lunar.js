/**
 * Thư viện tính toán lịch âm Việt Nam
 * Dựa trên thuật toán của Hồ Ngọc Đức
 */
class LunarCalendar {
    constructor() {
        this.PI = Math.PI;
        this.TIMEZONE = 7; // GMT+7 cho Việt Nam
    }

    /**
     * Tính số ngày Julian từ ngày dương lịch
     */
    jdFromDate(dd, mm, yy) {
        let a = Math.floor((14 - mm) / 12);
        let y = yy - a;
        let m = mm + 12 * a - 3;
        let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        if (jd < 2299161) {
            jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
        }
        return jd;
    }

    /**
     * Tính vị trí mặt trời (longitude)
     */
    sunLongitude(jdn) {
        let T = (jdn - 2451545.0) / 36525;
        let T2 = T * T;
        let dr = this.PI / 180;
        let M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
        DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
        let L = L0 + DL;
        L = L * dr;
        L = L - this.PI * 2 * Math.floor(L / (this.PI * 2));
        return Math.floor(L / this.PI * 6);
    }

    /**
     * Tìm ngày sóc (trăng mới)
     */
    getNewMoonDay(k, timeZone) {
        let T = k / 1236.85;
        let T2 = T * T;
        let T3 = T2 * T;
        let dr = this.PI / 180;
        let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
        Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
        C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
        C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
        C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
        C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
        C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
        C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
        let deltaT = 0;
        if (T < -11) {
            deltaT = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
        } else {
            deltaT = -0.000278 + 0.000265 * T + 0.000262 * T2;
        }
        let JdNew = Jd1 + C1 - deltaT;
        return Math.floor(JdNew + 0.5 + timeZone / 24);
    }

    /**
     * Tính tháng 11 âm lịch
     */
    getLunarMonth11(yy, timeZone) {
        let off = this.jdFromDate(31, 12, yy) - 2415021;
        let k = Math.floor(off / 29.530588853);
        let nm = this.getNewMoonDay(k, timeZone);
        let sunLong = this.sunLongitude(nm);
        if (sunLong >= 9) {
            nm = this.getNewMoonDay(k - 1, timeZone);
        }
        return nm;
    }

    /**
     * Kiểm tra năm nhuận âm lịch
     */
    getLeapMonthOffset(a11, timeZone) {
        let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
        let last = 0;
        let i = 1;
        let arc = this.sunLongitude(this.getNewMoonDay(k + i, timeZone));
        do {
            last = arc;
            i++;
            arc = this.sunLongitude(this.getNewMoonDay(k + i, timeZone));
        } while (arc != last && i < 14);
        return i - 1;
    }

    /**
     * Chuyển đổi từ dương lịch sang âm lịch
     */
    convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
        let dayNumber = this.jdFromDate(dd, mm, yy);
        let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
        let monthStart = this.getNewMoonDay(k + 1, timeZone);
        if (monthStart > dayNumber) {
            monthStart = this.getNewMoonDay(k, timeZone);
        }
        let a11 = this.getLunarMonth11(yy, timeZone);
        let b11 = a11;
        let lunarYear = yy;
        if (a11 >= monthStart) {
            lunarYear = yy;
            a11 = this.getLunarMonth11(yy - 1, timeZone);
        } else {
            lunarYear = yy + 1;
            b11 = this.getLunarMonth11(yy + 1, timeZone);
        }
        let lunarDay = dayNumber - monthStart + 1;
        let diff = Math.floor((monthStart - a11) / 29);
        let lunarLeap = 0;
        let lunarMonth = diff + 11;
        if (b11 - a11 > 365) {
            let leapMonthDiff = this.getLeapMonthOffset(a11, timeZone);
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10;
                if (diff == leapMonthDiff) {
                    lunarLeap = 1;
                }
            }
        }
        if (lunarMonth > 12) {
            lunarMonth = lunarMonth - 12;
        }
        if (lunarMonth >= 11 && diff < 4) {
            lunarYear -= 1;
        }
        return [lunarDay, lunarMonth, lunarYear, lunarLeap];
    }

    /**
     * Format hiển thị ngày âm lịch
     */
    formatLunarDate(dd, mm, yy) {
        try {
            let lunar = this.convertSolar2Lunar(dd, mm, yy);
            let lunarDay = lunar[0];
            let lunarMonth = lunar[1];
            let isLeap = lunar[3];
            
            return `${lunarDay}/${lunarMonth}${isLeap ? ' (nhuận)' : ''}`;
        } catch (error) {
            return '';
        }
    }

    /**
     * Lấy tên can chi của năm
     */
    getYearCanChi(year) {
        const can = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
        const chi = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
        
        return can[year % 10] + ' ' + chi[year % 12];
    }

    /**
     * Lấy con giáp của năm
     */
    getZodiacAnimal(year) {
        const animals = ['Khỉ', 'Gà', 'Chó', 'Heo', 'Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê'];
        return animals[year % 12];
    }
}
