import React from 'react';
import Box from '../assets/icons/box.svg?react';
import ChartBar from '../assets/icons/chartBar.svg?react';
import Container from '../assets/icons/container.svg?react';
import Docker from '../assets/icons/Docker.svg?react';
import ErrorIcon from '../assets/icons/err.svg?react'
import home from '../assets/icons/home.svg?react';
import layout from '../assets/icons/layout.svg?react';
import list from '../assets/icons/list.svg?react';
import off from '../assets/icons/off.svg?react';
import on from '../assets/icons/on.svg?react';
import pause from '../assets/icons/pause.svg?react';
import play from '../assets/icons/play.svg?react';
import plus from '../assets/icons/plus.svg?react';
import squares from '../assets/icons/squares.svg?react';
import trash from '../assets/icons/trash.svg?react';
import user from '../assets/icons/user.svg?react';

type IconName = 'box' | 'chartBar' | 'container' | 'docker' | 'errorIcon' | 'home' | 'layout' | 'list' | 'off' | 'on' | 'user' | 'pause' | 'play' | 'squares' | 'trash' | 'plus';

const icons: Record<IconName, React.FC<React.SVGProps<SVGSVGElement>>> = {
    box: Box,
    chartBar: ChartBar,
    container: Container,
    docker: Docker,
    errorIcon: ErrorIcon,
    home: home,
    layout: layout,
    list: list,
    off: off,
    on: on,
    pause: pause,
    play: play,
    plus: plus,
    squares: squares,
    trash: trash,
    user: user,


};

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    const SvgIcon = icons[name];
    return <SvgIcon {...props} />;
};